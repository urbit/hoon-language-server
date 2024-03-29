# hoon-language-server

Earth-side component of a language server for Hoon. Enables two-way communication between supported text editors and the `language-server` agent on an urbit ship.
## Installation
### npm
```bash
npm install -g @urbit/hoon-language-server
```
### nix
```bash
nix-build -E 'with import <nixpkgs> {}; callPackage ./default.nix {}'
nix-env -i ./result
```

## Running
> **_NOTE:_**  Usually your editor will handle this, you just need to set the correct parameters in your editor configuration.
> 
`hoon-language-server -p 80 -d 0 -u http://localhost -s zod -c lidlut-tabwed-pillex-ridrup`

### Configuration
- `-p`: HTTP port of your (running) ship
- `-d`: `didSave` event delay
- `-u`: ship url
- `-s`: `@p` of ship (without a sig)
- `-c`: `+code` of ship (without a sig)

## Urbit Setup

You must have an urbit ship running (can be a livenet ship) with the `language-server` agent started.  To create and start a fake `~zod`:

```
urbit -F zod -c zod
```

In the urbit dojo, start the language server:

```
dojo> |start %language-server
```

get the `+code`

```
dojo> +code
```

To start the same ship again in the future just run:

```
urbit zod
```

in the same directory it was created in.

## Editor Setup

Your code editor now needs to use `hoon-language-server` as an LSP provider. Supported plugins:
### VSCode

 * [hoon-vscode](https://github.com/famousj/hoon-vscode)
 * [hoon-assist-vscode](https://github.com/urbit/hoon-assist-vscode)

### Emacs

 * [hoon-mode.el](https://github.com/urbit/hoon-mode.el)

### Vim

 * [hoon.vim](https://github.com/urbit/hoon.vim)

`hoon.vim` does not use the language server itself, but the github page describes a setup using [vim-lsp](https://github.com/prabirshrestha/vim-lsp).

### Neovim

Neovim users should use [hoon.vim](https://github.com/urbit/hoon.vim) with one of the following LSP setups:

#### Native LSP

Install [nvim-lspconfig](https://github.com/neovim/nvim-lspconfig).  To use the [default configuration](https://github.com/neovim/nvim-lspconfig/blob/master/doc/server_configurations.txt#hoon_ls), add the following to `init.lua`:

```
require'lspconfig'.hoon_ls.setup{}
```

To modify the default options use:

```
require'lspconfig'.hoon_ls.setup{
  cmd = {"hoon-language-server", "-p", "8080"}
}
```

You can include lua snippets in your `init.vim` like so:

```
lua << EOF
require'lspconfig'.hoon_ls.setup{}
EOF
```

#### coc.nvim

Install and configure [coc.nvim](https://github.com/neoclide/coc.nvim), then add a `languageserver` entry to `~/.config/nvim/coc-settings.json`:

```
{
  "languageserver": {
    "hoon-language-server": {
      "command": "hoon-language-server",
      "args": ["-p", "8080"],
      "filetypes": ["hoon"]
    }
  }
}
```
