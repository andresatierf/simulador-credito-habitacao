-- LazyVim project config: use the TypeScript 7 native language server (`tsc --lsp`)
-- instead of vtsls, which needs the tsserver.js that TypeScript 7 no longer ships.
return {
  {
    "neovim/nvim-lspconfig",
    opts = {
      servers = {
        tsc = { enabled = true },
        vtsls = { enabled = false },
      },
    },
  },
}
