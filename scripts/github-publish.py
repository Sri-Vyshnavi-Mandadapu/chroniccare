"""Create the private source repository using Git Credential Manager; never print credentials."""
import json, subprocess, urllib.request, urllib.error
credential = subprocess.run(['git','credential','fill'], input='protocol=https\nhost=github.com\n\n', text=True, capture_output=True, check=True)
fields = dict(line.split('=',1) for line in credential.stdout.splitlines() if '=' in line)
headers = {'Authorization':'Bearer '+fields['password'], 'Accept':'application/vnd.github+json', 'User-Agent':'ChronicCare-deployment'}
def call(path, data=None):
    request=urllib.request.Request('https://api.github.com'+path, headers=headers, data=json.dumps(data).encode() if data else None)
    with urllib.request.urlopen(request,timeout=30) as response: return json.load(response)
user=call('/user')['login']
try:
    repo=call('/repos/'+user+'/chroniccare')
    print('EXISTING_REPOSITORY '+repo['html_url'])
except urllib.error.HTTPError as error:
    if error.code!=404: raise SystemExit('GitHub request failed: HTTP '+str(error.code))
    repo=call('/user/repos',{'name':'chroniccare','description':'ChronicCare — 3D chronic care tracking, React + Netlify Functions + MongoDB Atlas. Synthetic portfolio demo.','private':True,'auto_init':False})
    print('CREATED_REPOSITORY '+repo['html_url'])
print('CLONE_URL '+repo['clone_url'])
