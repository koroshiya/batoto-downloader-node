# batoto-downloader-node

**Desktop application used to download comics from Batoto**

##This application is still in early development.

Check TODO.txt for a list of things that need to be done.

### How to run

Install NodeJS and NPM, if not already present.

Clone the repo and cd into its directory.

Run `npm install` to install all of the necessary dependencies.

Run `npm start` to start the application.

### How to develop/build

To compile new handlebars templates, or recompile existing templates, you will need to have the handlebars npm module installed.

`npm install handlebars -g`

For your own sanity, you may also wish to integrate the handlebars build system into your IDE.

For sublime text, this would be:

```
{
  "selector": "source.handlebars",
  "cmd": ["handlebars", "$file", "-f", "$file_path/../js/$file_base_name.hbs.min.js", "-m"],
  
  "windows": {
    "cmd": ["handlebars.cmd", "$file", "-f", "$file_path/../js/$file_base_name.hbs.min.js", "-m"]
  }
}
```



#### License [MIT](LICENSE.md)
