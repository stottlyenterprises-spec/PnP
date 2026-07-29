export default function PrivacyPage() {
  return (
    <main style={{maxWidth:760,margin:"0 auto",padding:"48px 24px 80px",fontFamily:"system-ui, sans-serif",lineHeight:1.65,color:"#18352e"}}>
      <p style={{letterSpacing:".12em",textTransform:"uppercase",fontSize:12}}>D.E.E.D.S.</p>
      <h1 style={{fontSize:"clamp(2rem, 6vw, 4rem)",lineHeight:1.05}}>Health data privacy</h1>
      <p><b>Progress, Not Perfection</b> uses connected health information to reduce duplicate entry in your private daily check-ins.</p>
      <h2>What D.E.E.D.S. reads</h2>
      <p>The native app requests read-only access to sleep duration and weight from Apple Health or Health Connect. It does not write, sell, advertise with, or share this information.</p>
      <h2>How it is used</h2>
      <p>Sleep and weight can prefill the matching fields in D.E.E.D.S. and support personal trends and reports. Information you enter manually keeps priority over connected sources.</p>
      <h2>Where it is stored</h2>
      <p>Health information is saved with the rest of your D.E.E.D.S. record on your device. If you choose private cross-device saving, that record is stored in your connected Google Drive app-data space.</p>
      <h2>Your control</h2>
      <p>You choose whether to connect a health provider. You can change or revoke access at any time in Apple Health or Health Connect settings. D.E.E.D.S. continues to work with manual entry when access is unavailable or disabled.</p>
      <p style={{marginTop:40,fontSize:14}}>Last updated July 29, 2026.</p>
    </main>
  );
}
