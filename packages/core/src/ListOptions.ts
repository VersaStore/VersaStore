export enum ListOptions {
    NONE = 0,
    RECURSIVE = 1,
    INCLUDE_DOTFILES = 2,
    INCLUDE_SYMLINKS = 4,

    DEFAULT = NONE | INCLUDE_SYMLINKS | INCLUDE_DOTFILES,
}