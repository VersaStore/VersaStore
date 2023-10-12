export enum ListOptions {
    NONE = 0,
    RECURSIVE = 1,
    INCLUDE_DOTFILES = 2,

    DEFAULT = NONE | RECURSIVE | INCLUDE_DOTFILES,
}
