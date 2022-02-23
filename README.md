
# @rowanmanning/render-error-page

Render nice error pages with [Express](https://expressjs.com).


## Table of Contents

  * [Requirements](#requirements)
  * [Usage](#usage)
  * [Contributing](#contributing)
  * [License](#license)


## Requirements

This library requires the following to run:

  * [Node.js](https://nodejs.org/) 12+


## Usage

Install with [npm](https://www.npmjs.com/):

```sh
npm install @rowanmanning/render-error-page
```

Load the library into your code with a `require` call:

```js
const renderErrorPage = require('@rowanmanning/render-error-page');
```

Create the error rendering middleware and add it as the very last one to your Express app (more details available in [this Express guide](https://expressjs.com/en/guide/error-handling.html)):

```js
const express = require('express');
const renderErrorPage = require('@rowanmanning/render-error-page');

const app = express();

app.get('/', (request, response, next) => {
    next(new Error('Oops'));
});

// Your error page!
app.use(renderErrorPage());
```

`renderErrorPage` relies on the Express built-in rendering method: `response.render`. You'll need to create an `error` view in your Express application. Where and how you do this depends on what your view rendering setup is. Normally it'll be a file like:

```
views/error.html
```

Replace `.html` above with the correct file extension for your views. Once you've done this, you can access the following view data:

  * **`error.statusCode`:** the HTTP status code of the error (taken from the original error's `statusCode` or `status` properties)
  * **`error.message`:** the actual error message
  * **`error.stack`:** the full error stack (if made available based on [options](#options))

An example in Handlebars:

```html
<h1>Error {{error.statusCode}}</h1>
<p>{{error.message}}</p>
{{#if error.stack}}
    <pre>{{error.stack}}</pre>
{{/if}}
```

If your template cannot be rendered for some reason, then a basic fallback template will be used instead.

### Options

You can configure the middleware using a few different options:

```js
app.use(renderErrorPage({
    exampleOption: true
}));
```

The available options are:

  * **`defaultStatusCode`:** the HTTP status code to send if the error does not have a `statusCode` or `status` property. Defaults to `500`
  * **`errorLogger`:** a function which can be used to log errors so that information is available in your server logs. This function should accept a single parameter: the error object. Defaults to `console.error`
  * **`errorLoggingFilter`:** a function which returns `true` or `false` when called with an error object. When `false` is returned, the given error will not be logged with `errorLogger`. Defaults to a function which always returns `true`
  * **`errorView`:** the name of the view to render when an error occurs, relative to the Express `views` directory. Defaults to `"error"`
  * **`includeErrorStack`:** a boolean indicating whether to include the error stack in the output. Defaults to `false` if the `NODE_ENV` environment variable is set to `"production"`, or `true` otherwise


## Contributing

[The contributing guide is available here](docs/contributing.md). All contributors must follow [this library's code of conduct](docs/code_of_conduct.md).


## License

Licensed under the [MIT](LICENSE) license.<br/>
Copyright &copy; 2019, Rowan Manning
