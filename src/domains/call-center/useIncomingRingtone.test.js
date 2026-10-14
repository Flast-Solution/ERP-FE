import {startIncomingRingtone} from './useIncomingRingtone';
test('loops the provided ringtone and stops/reset when the incoming call ends',async()=>{
 const audio={play:jest.fn().mockResolvedValue(),pause:jest.fn(),currentTime:12};
 const ringtone=startIncomingRingtone(audio);
 expect(audio.loop).toBe(true);
 expect(audio.play).toHaveBeenCalledTimes(1);
 await Promise.resolve();ringtone.stop();
 expect(audio.pause).toHaveBeenCalled();expect(audio.currentTime).toBe(0);
 ringtone.play();expect(audio.play).toHaveBeenCalledTimes(1);
});
test('allows retry when browser autoplay is blocked',async()=>{
 const audio={play:jest.fn().mockRejectedValueOnce(new Error('NotAllowedError')).mockResolvedValueOnce(),pause:jest.fn(),currentTime:0},blocked=jest.fn();
 const ringtone=startIncomingRingtone(audio,blocked);
 await new Promise(resolve=>setTimeout(resolve,0));expect(blocked).toHaveBeenCalledWith(true);
 ringtone.play();await new Promise(resolve=>setTimeout(resolve,0));expect(blocked).toHaveBeenCalledWith(false);
 ringtone.stop();
});
