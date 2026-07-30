type ResettableTask = {
 done:boolean;
 recurring?:boolean;
 section:string;
 completed?:string;
};

export function resetCompletedTasksForNewDay<T extends ResettableTask>(tasks:T[]):T[]{
 return tasks.flatMap(task=>{
  if(!task.done)return[task];
  if(task.section==="stottly"||task.section==="businessLong"){
   return[{...task,done:false,completed:undefined}];
  }
  return task.recurring?[task]:[];
 });
}
