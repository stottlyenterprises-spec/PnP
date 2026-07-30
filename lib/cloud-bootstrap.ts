export type CloudBootstrapAction="accept-remote"|"upload-local"|"recover-history";

export function cloudBootstrapAction(input:{
 remoteFound:boolean;
 localItems:number;
 remoteItems:number;
 localDirty:boolean;
 localUpdatedAt:number;
 remoteUpdatedAt:number;
}):CloudBootstrapAction{
 if(!input.remoteFound)return input.localItems>0?"upload-local":"recover-history";
 if(input.remoteItems>0&&input.localItems===0)return"accept-remote";
 if(input.localItems>0&&input.remoteItems===0)return"upload-local";
 if(input.localItems===0&&input.remoteItems===0)return"recover-history";
 if(input.localDirty&&input.localUpdatedAt>input.remoteUpdatedAt)return"upload-local";
 return"accept-remote";
}
