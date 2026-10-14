import {useEffect,useRef,useState,useCallback} from 'react';
import ringtoneUrl from './assets/yealink_grand.mp3';
import {CALL_STATUS} from './constants';

export const startIncomingRingtone = (audio,onBlocked=()=>{}) => {
 let stopped=false;
 audio.loop=true;
 audio.volume=0.8;
 const play=()=>{
  if(stopped)return;
  try{Promise.resolve(audio.play()).then(()=>{if(!stopped)onBlocked(false);else{audio.pause();audio.currentTime=0;}}).catch(()=>{if(!stopped)onBlocked(true);});}
  catch{if(!stopped)onBlocked(true);}
 };
 play();
 return {play,stop:()=>{stopped=true;audio.pause();audio.currentTime=0;}};
};

export default function useIncomingRingtone(status){
 const controller=useRef(null);
 const [blocked,setBlocked]=useState(false);
 useEffect(()=>{
  setBlocked(false);
  if(status!==CALL_STATUS.INCOMING)return undefined;
  const audio=new Audio(ringtoneUrl);
  const ringtone=startIncomingRingtone(audio,setBlocked);
  controller.current=ringtone;
  return()=>{controller.current=null;ringtone.stop();};
 },[status]);
 const enable=useCallback(()=>controller.current?.play(),[]);
 return {blocked,enable};
}
