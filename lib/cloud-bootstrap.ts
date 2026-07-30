export type CloudBootstrapAction="accept-remote"|"upload-local"|"recover-history";

export function cloudBootstrapAction(input:{
 remoteFound:boolean;
 localItems:number;
 remoteItems:number;
 localDirty:boolean;
 localCloudRevision:number;
 remoteRevision:number;
 localUpdatedAt:number;
 remoteUpdatedAt:number;
}):CloudBootstrapAction{
 if(!input.remoteFound)return"recover-history";
 if(input.remoteItems>0&&input.localItems===0)return"accept-remote";
 if(input.remoteItems>0&&input.localCloudRevision===0)return"accept-remote";
 if(input.localItems>0&&input.remoteItems===0)return"recover-history";
 if(input.localItems===0&&input.remoteItems===0)return"recover-history";
 if(
  input.localDirty&&
  input.localCloudRevision===input.remoteRevision&&
  input.localUpdatedAt>input.remoteUpdatedAt
 )return"upload-local";
 return"accept-remote";
}
