Wallboard
=========

Real-time dashboards for everyone

Wallboard is a simple data store and presenting system


### Requirements
* Mongodb
* Nodejs


## Sending data to Wallboard
How to push updates to Wallboard
### Linux command line
```
curl -X POST -H "Content-Type: application/json" -d '{"stream_name":"element1","value":"4"}' https://yourserver/send
```


### Python
```
import urllib2
import json

wallboard_url = 'https://yourserver/send'
data = json.dumps({"stream_name":"element1","value":5})
request = urllib2.Request(wallboard_url, data, {'Content-Type': 'application/json', 'Content-Length':len(data)})
response = urllib2.urlopen(request)
```

### Powershell
```
Invoke-WebRequest -Uri https://yourserver/send -Method POST -ContentType 'application/json;' -Body ([System.Text.Encoding]::UTF8.GetBytes('{"stream_name":"element1","value":"Árvíztûrõtükörfúrógép"}'))
```







