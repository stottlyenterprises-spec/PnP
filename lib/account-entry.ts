export type AccountEntryState={
 ready:boolean;
 identityChecked:boolean;
 connected:boolean;
 cloudReady:boolean;
 cloudRecordStatus:"unknown"|"populated"|"empty";
 onboardingOpen:boolean;
 onboardingComplete:boolean;
 showAccountGateway:boolean;
};

export function shouldRestoreAccount(state:AccountEntryState){
 return state.ready&&state.identityChecked&&state.connected&&state.cloudRecordStatus==="unknown";
}

export function shouldShowFirstConversation(state:AccountEntryState){
 if(!state.ready||!state.identityChecked||shouldRestoreAccount(state))return false;
 return state.connected&&state.cloudReady&&state.onboardingOpen;
}
