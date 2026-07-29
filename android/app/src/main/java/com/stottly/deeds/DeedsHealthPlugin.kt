package com.stottlyenterprises.progressnotperfection.deeds

import android.content.Intent
import androidx.activity.result.ActivityResult
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.WeightRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import java.time.Duration
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter

@CapacitorPlugin(name = "DeedsHealth")
class DeedsHealthPlugin : Plugin() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val permissions = setOf(
        HealthPermission.getReadPermission(SleepSessionRecord::class),
        HealthPermission.getReadPermission(WeightRecord::class),
    )

    private val provider: String
        get() = "Health Connect"

    private fun client() = HealthConnectClient.getOrCreate(context)

    private fun available() =
        HealthConnectClient.getSdkStatus(context) == HealthConnectClient.SDK_AVAILABLE

    @PluginMethod
    fun status(call: PluginCall) {
        if (!available()) {
            call.resolve(state(false, false, "Health Connect is not available on this device."))
            return
        }
        scope.launch {
            try {
                val authorized = client().permissionController.getGrantedPermissions().containsAll(permissions)
                call.resolve(state(true, authorized))
            } catch (error: Exception) {
                call.resolve(state(true, false, error.localizedMessage))
            }
        }
    }

    @PluginMethod
    fun requestAccess(call: PluginCall) {
        if (!available()) {
            call.resolve(state(false, false, "Health Connect is not available on this device."))
            return
        }
        scope.launch {
            try {
                val granted = client().permissionController.getGrantedPermissions()
                if (granted.containsAll(permissions)) {
                    call.resolve(state(true, true, "Health Connect access is ready."))
                    return@launch
                }
                val contract = PermissionController.createRequestPermissionResultContract()
                val intent = contract.createIntent(context, permissions)
                activity.runOnUiThread {
                    startActivityForResult(call, intent, "healthPermissionResult")
                }
            } catch (error: Exception) {
                call.reject(error.localizedMessage ?: "Health Connect access could not be requested.")
            }
        }
    }

    @ActivityCallback
    private fun healthPermissionResult(call: PluginCall, result: ActivityResult) {
        scope.launch {
            try {
                val authorized = client().permissionController.getGrantedPermissions().containsAll(permissions)
                call.resolve(state(
                    true,
                    authorized,
                    if (authorized) "Health Connect access is ready." else "Sleep and weight access were not granted.",
                ))
            } catch (error: Exception) {
                call.reject(error.localizedMessage ?: "Health Connect permissions could not be checked.")
            }
        }
    }

    @PluginMethod
    fun readRecent(call: PluginCall) {
        if (!available()) {
            call.resolve(state(false, false, "Health Connect is not available on this device.", JSArray()))
            return
        }
        scope.launch {
            try {
                val healthClient = client()
                val authorized = healthClient.permissionController.getGrantedPermissions().containsAll(permissions)
                if (!authorized) {
                    call.resolve(state(true, false, "Connect Health Connect to import sleep and weight.", JSArray()))
                    return@launch
                }

                val requestedDays = (call.getInt("days") ?: 14).coerceIn(1, 30)
                val end = Instant.now()
                val start = end.minus(Duration.ofDays(requestedDays.toLong()))
                val range = TimeRangeFilter.between(start, end)
                val sleep = healthClient.readRecords(
                    ReadRecordsRequest(SleepSessionRecord::class, range)
                ).records
                val weight = healthClient.readRecords(
                    ReadRecordsRequest(WeightRecord::class, range)
                ).records
                call.resolve(state(true, true, "Health Connect refreshed.", dailyResults(sleep, weight)))
            } catch (error: Exception) {
                call.reject(error.localizedMessage ?: "Health Connect data could not be read.")
            }
        }
    }

    @PluginMethod
    fun openSettings(call: PluginCall) {
        try {
            val intent = Intent(HealthConnectClient.ACTION_HEALTH_CONNECT_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(intent)
            call.resolve()
        } catch (_: Exception) {
            call.resolve()
        }
    }

    override fun handleOnDestroy() {
        scope.cancel()
        super.handleOnDestroy()
    }

    private fun state(
        available: Boolean,
        authorized: Boolean,
        message: String? = null,
        days: JSArray? = null,
    ): JSObject {
        val result = JSObject()
        result.put("provider", provider)
        result.put("available", available)
        result.put("authorized", authorized)
        if (message != null) result.put("message", message)
        if (days != null) result.put("days", days)
        return result
    }

    private fun dailyResults(
        sleep: List<SleepSessionRecord>,
        weight: List<WeightRecord>,
    ): JSArray {
        val zone = ZoneId.systemDefault()
        val dateFormat = DateTimeFormatter.ISO_LOCAL_DATE
        data class SleepValue(val hours: Double, val source: String)
        data class WeightValue(val pounds: Double, val source: String, val time: Instant)
        val bestSleep = mutableMapOf<String, SleepValue>()
        val latestWeight = mutableMapOf<String, WeightValue>()

        sleep.forEach { record ->
            val date = dateFormat.format(record.endTime.atZone(zone).toLocalDate())
            val hours = Duration.between(record.startTime, record.endTime).toMinutes() / 60.0
            val current = bestSleep[date]
            if (hours > (current?.hours ?: 0.0)) {
                bestSleep[date] = SleepValue(hours, record.metadata.dataOrigin.packageName)
            }
        }

        weight.forEach { record ->
            val date = dateFormat.format(record.time.atZone(zone).toLocalDate())
            val current = latestWeight[date]
            if (current == null || record.time > current.time) {
                latestWeight[date] = WeightValue(
                    record.weight.inPounds,
                    record.metadata.dataOrigin.packageName,
                    record.time,
                )
            }
        }

        val days = JSArray()
        (bestSleep.keys + latestWeight.keys).toSortedSet().forEach { date ->
            val item = JSObject()
            item.put("date", date)
            bestSleep[date]?.let {
                item.put("sleepHours", it.hours)
                item.put("sleepSource", provider)
                item.put("sleepDeviceSource", it.source)
            }
            latestWeight[date]?.let {
                item.put("weightPounds", it.pounds)
                item.put("weightSource", provider)
                item.put("weightDeviceSource", it.source)
            }
            days.put(item)
        }
        return days
    }
}
