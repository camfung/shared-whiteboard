# Source this from ~/.zshrc to enable `wb` completion:
#   source "/home/camer/ClaudeChats/Shared Whiteboard/completions/wb-completion.zsh"
_wb_comp_dir="${0:A:h}"
fpath=("$_wb_comp_dir" $fpath)
autoload -Uz compinit
compinit -C   # -C: skip the security audit (faster; drop it if you want the check)
