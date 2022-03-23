A language server for Hoon.

Install with:

```
npm install -g @urbit/hoon-language-server
```

Make sure you have a fake ~zod running on localhost:8080 and you've installed a
Hoon plugin for your editor, like hoon.vim.

To use with nvim-lspconfig:

Add a snippet to init.vim:

```
lua << EOF
require'lspconfig'.hoon_ls.setup{
  cmd = {"hoon-language-server" "-p", "80", "-d", "500", -s "zod", "-u", "http://localhost", "-c" "lidlut-tabwed-pillex-ridrup"},
  filetypes = {"hoon"},
  single_file_support = true
}
EOF
```

Note that the values provided above are for reference, you can choose to provide no flags/values and use the defaults or set your own.

The default values are: `-p 80 -d 0 -u http://localhost -s zod -c lidlut-tabwed-pillex-ridrup`

- `-p` is the port your ship is accessible on over HTTP
- `-d` is the delay for running didSave events
- `-u` is the URL of your ship
- `-s` is the `@p`` of your ship (without a sig)
- `-c` is the `+code` of the running urbit (also without a sig)
