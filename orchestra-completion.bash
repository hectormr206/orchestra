# orchestra bash completion script

_orchestra_completion() {
    local cur prev words cword
    _init_completion || return

    # Commands
    commands="start resume pipeline watch status plan clean doctor init validate dry-run export history notify cache tui help completion"

    # Options for start
    start_options="--auto-approve --parallel --no-tests --no-commit --dry-run"

    # Options for resume
    resume_options="--force --clean"

    # Options for pipeline
    pipeline_options="--auto-approve --parallel"

    # Options for watch
    watch_options="--debounce"

    # Options for validate
    validate_options="--language"

    # Options for dry-run
    dry_run_options="--format"

    # Options for export
    export_options="--format --output"

    # Options for history
    history_options="--limit --status --search"

    # Options for notify
    notify_options="--slack --discord --webhook"

    # Options for cache
    cache_options="--clear --stats"

    # Options for tui
    tui_options="--auto-approve"

    # Options for completion
    completion_options="--bash --zsh --fish --install --uninstall"

    # Current command
    local cmd="${words[1]}"

    case "${cur}" in
        --*)
            case "${cmd}" in
                start)
                    COMPREPLY=($(compgen -W "${start_options}" -- "${cur}"))
                    ;;
                resume)
                    COMPREPLY=($(compgen -W "${resume_options}" -- "${cur}"))
                    ;;
                pipeline)
                    COMPREPLY=($(compgen -W "${pipeline_options}" -- "${cur}"))
                    ;;
                watch)
                    COMPREPLY=($(compgen -W "${watch_options}" -- "${cur}"))
                    ;;
                validate)
                    COMPREPLY=($(compgen -W "${validate_options}" -- "${cur}"))
                    ;;
                dry-run)
                    COMPREPLY=($(compgen -W "${dry_run_options}" -- "${cur}"))
                    ;;
                export)
                    COMPREPLY=($(compgen -W "${export_options}" -- "${cur}"))
                    ;;
                history)
                    COMPREPLY=($(compgen -W "${history_options}" -- "${cur}"))
                    ;;
                notify)
                    COMPREPLY=($(compgen -W "${notify_options}" -- "${cur}"))
                    ;;
                cache)
                    COMPREPLY=($(compgen -W "${cache_options}" -- "${cur}"))
                    ;;
                tui)
                    COMPREPLY=($(compgen -W "${tui_options}" -- "${cur}"))
                    ;;
                completion)
                    COMPREPLY=($(compgen -W "${completion_options}" -- "${cur}"))
                    ;;
                *)
                    ;;
            esac
            ;;
        *)
            if [ ${cword} -eq 1 ]; then
                COMPREPLY=($(compgen -W "${commands}" -- "${cur}"))
            fi
            ;;
    esac
} &&
complete -F _orchestra_completion orchestra

# Also support orchestra prefixed commands if aliased
complete -F _orchestra_completion orchestra
