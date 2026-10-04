# Trunk giả (cổng 5081 = profile trunk) gọi DID vào SBC: python3 caller.py <did> <talk|cancel|wait> <giây>
import socket, sys, time, re, struct, math, threading, audioop, random
ext, mode, secs = sys.argv[1], sys.argv[2], float(sys.argv[3])
sip=socket.socket(socket.AF_INET,socket.SOCK_DGRAM); sip.bind(('127.0.0.1',5081)); sport=sip.getsockname()[1]; sip.settimeout(0.3)
rtp=socket.socket(socket.AF_INET,socket.SOCK_DGRAM); rtp.bind(('127.0.0.1',0)); rport=rtp.getsockname()[1]; rtp.settimeout(0.3)
cid=f"c{random.randint(1,10**9)}@t"; ftag="f"+str(random.randint(1,10**6)); br="z9hG4bK"+str(random.randint(1,10**9))
dst=('127.0.0.1',5060); ruri=f"sip:{ext}@127.0.0.1:5060"
sdp=f"v=0\r\no=- 1 1 IN IP4 127.0.0.1\r\ns=-\r\nc=IN IP4 127.0.0.1\r\nt=0 0\r\nm=audio {rport} RTP/AVP 0 8\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:8 PCMA/8000\r\n"
def req(method, cseq, to, body='', branch=None, cseq_m=None):
    m=f"{method} {ruri} SIP/2.0\r\nVia: SIP/2.0/UDP 127.0.0.1:{sport};branch={branch or br}\r\nMax-Forwards: 70\r\nFrom: <sip:0987654321@127.0.0.1>;tag={ftag}\r\nTo: {to}\r\nCall-ID: {cid}\r\nCSeq: {cseq} {cseq_m or method}\r\nContact: <sip:0987654321@127.0.0.1:{sport}>\r\n"
    m+=("Content-Type: application/sdp\r\n" if body else "")+f"Content-Length: {len(body)}\r\n\r\n{body}"
    sip.sendto(m.encode(),dst)
st={'rx':0,'e':0.0,'peer':None,'run':True}
def rx():
    while st['run']:
        try: d,_=rtp.recvfrom(2000)
        except socket.timeout: continue
        pt=d[1]&0x7f; pcm=audioop.ulaw2lin(d[12:],2) if pt==0 else audioop.alaw2lin(d[12:],2)
        st['rx']+=1; st['e']+=audioop.rms(pcm,2)
def tx():
    seq=ts=ph=0
    while st['run']:
        if st['peer']:
            s=audioop.lin2ulaw(b''.join(struct.pack('<h',int(8000*math.sin(2*math.pi*440*(ph+i)/8000))) for i in range(160)),2); ph+=160
            rtp.sendto(struct.pack('!BBHII',0x80,0,seq&0xffff,ts,0x2222)+s,st['peer']); seq+=1; ts+=160
        time.sleep(0.02)
threading.Thread(target=rx,daemon=True).start(); threading.Thread(target=tx,daemon=True).start()
to=f"<{ruri}>"; req('INVITE',1,to,sdp)
t0=time.time(); final=None; totag=None; codes=[]
while time.time()-t0<secs+15:
    if mode=='cancel' and time.time()-t0>secs and final is None:
        req('CANCEL',1,to,cseq_m='CANCEL'); mode='cancelled'
    try: d,_=sip.recvfrom(8000)
    except socket.timeout: continue
    m=d.decode(errors='ignore'); first=m.split('\r\n')[0]
    if first.startswith('SIP/2.0'):
        code=int(first.split()[1]); meth=re.search(r'CSeq:\s*\d+\s+(\w+)',m).group(1)
        if meth!='INVITE': continue
        codes.append(code)
        if code>=200:
            final=code; totag=re.search(r'^To:\s*(.*)$',m,re.M).group(1).strip()
            req('ACK',1,totag,branch=br if code>=300 else br+"a")
            if code==200:
                st['early']=st['rx']
                b=m.split('\r\n\r\n',1)[1]; st['peer']=(re.search(r'c=IN IP4 (\S+)',b).group(1),int(re.search(r'm=audio (\d+)',b).group(1)))
                print('CALLER answered, sems answer codec:', re.search(r'm=audio .*',b).group(0), flush=True)
                time.sleep(secs); req('BYE',2,totag,branch=br+"b"); time.sleep(0.5)
            break
    elif first.startswith('BYE'):
        vias=''.join(l+'\r\n' for l in m.split('\r\n') if l.lower().startswith('via:'))
        sip.sendto((f"SIP/2.0 200 OK\r\n{vias}"+ ''.join(l+'\r\n' for l in m.split('\r\n') if l.split(':')[0] in ('From','To','Call-ID','CSeq'))+"Content-Length: 0\r\n\r\n").encode(),dst)
        print('CALLER got BYE',flush=True); break
st['run']=False
print(f"CALLER codes={codes} final={final} early_pkts={st.get('early',0)} rx_pkts={st['rx']} rx_rms={st['e']/max(1,st['rx']):.0f}",flush=True)
