# Recon Docs

This book is built using [mdBook](https://github.com/rust-lang/mdBook)

## Contributing 

First download [mdBook](https://rust-lang.github.io/mdBook/guide/installation.html).

To contribute to the docs, you can clone the repository and make changes to the markdown files in the `src` directory. 

You can see your changes in real time by running `mdbook serve` in the root of the repository which will serve the book at `http://localhost:3000`.

See the [anatomy of a book](https://rust-lang.github.io/mdBook/guide/creating.html#anatomy-of-a-book) section for how to add new pages and format them.

## Deployment 

Once the book is ready to be deployed, you can run `mdbook build` to build the book. This generates a directoy named `book` with the html files that can be added to any webserver for hosting. 

Currently hosted at: https://recon-fuzz.github.io/recon-docs/
