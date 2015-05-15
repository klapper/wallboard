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
```Shell
curl -X POST -H "Content-Type: application/json" -d '{"stream_name":"element1","value":"4"}' https://yourserver/send
```


### Python
```Python
import urllib2
import json

wallboard_url = 'https://yourserver/send'
data = json.dumps({"stream_name":"element1","value":5})
request = urllib2.Request(wallboard_url, data, {'Content-Type': 'application/json', 'Content-Length':len(data)})
response = urllib2.urlopen(request)
```

### PowerShell
```PowerShell
Invoke-WebRequest -Uri https://yourserver/send -Method POST -ContentType 'application/json;' -Body ([System.Text.Encoding]::UTF8.GetBytes('{"stream_name":"element1","value":"Árvíztûrõtükörfúrógép"}'))
```


# How to create your own widgets
Create the following files in `/public/elements` (change widget to the name of your new widget)
* widget.config.json
* widget.html
* widget.png
And edit the `elements/widget_list.json` file to include your widget 

### widget.config.json
It is a JSON file that describes the configuration page of your widget

* `name`: id of the configuration item (you can reference this id in the template html)
* `display_name`:  Name of the configuration item that shows in the Configure widget dialog
* `description`: 
* `type`: The type of the input, that can be:
  * `stream_selector`: Dropdown list of available streams and search as you type 
  * `text`: simple html text input
  * `color_chooser`: color picker
  * `checkbox`: checkbox
  * `icon_picker`: icon picker with Bootstrap and Font Awesome icons
  * `divider`: divider bar

#### sample
```JSON
 [
    {
      "name":"stream_name",
      "diplay_name":"Stream name",
      "description":"Please specify the stream name",
      "type":"stream_selector"
    },
    {
      "name":"progress_color",
      "display_name":"Progress Color",
      "description":"Color of progressbar",
      "type":"color_chooser",
      "value":"#50e84b"
    },    
    {
      "name":"min_value",
      "diplay_name":"Minimum value",
      "description":"",
      "type":"text",
      "value":0
    },
    {
      "name":"max_value",
      "diplay_name":"Maximum value",
      "description":"",
      "type":"text",
      "value":100
    },
   {
    "name":"background_color",
    "display_name":"Background color",
    "description":"Color of the tile's background",
    "type":"color_chooser",
    "value":"#000000"
  }
  ]
```

#### widget.html
This html fragment will be included in a dashboard with the [ng-include](https://docs.angularjs.org/api/ng/directive/ngInclude) directive by angular

Design your layout to adapt any widget sizes (like tall, wide, small, big)

Use the {{data.value}} to reference the current value of the stream like this 
`<h1>The current value of the stream is {{data.value}}</h1>`

Use the data.template_config.variable to access the configuration variable (from the config.json)
for example:
```
<p ng-style='{"font-size": data.template_config.text_size + "vw","color":data.template_config.text_color}'>
    {{data.value}}
</p>
```

#### widget.png
Screenshot of your widget that shows on the widget selector screen 150x150 pixels

