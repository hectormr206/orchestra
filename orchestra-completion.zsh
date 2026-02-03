#compdef orchestra
# orchestra zsh completion script

_orchestra() {
    local -a commands
    commands=(
        'start:Start a new orchestration task'
        'resume:Resume an interrupted session'
        'pipeline:Execute in pipeline mode'
        'watch:Watch mode with auto-reload'
        'status:Show current session status'
        'plan:View current execution plan'
        'clean:Clean session data'
        'doctor:Verify setup and dependencies'
        'init:Create .orchestrarc.json config'
        'validate:Validate syntax of files'
        'dry-run:Analyze without execution'
        'export:Export session data'
        'history:Show session history'
        'notify:Configure notifications'
        'cache:Manage cache'
        'tui:Launch Terminal UI'
        'help:Show help'
        'completion:Shell completion setup'
    )

    local -a start_options
    start_options=(
        '--auto-approve:Auto-approve plans'
        '--parallel:Use parallel execution'
        '--no-tests:Skip running tests'
        '--no-commit:Skip git commit'
        '--dry-run:Show what would be done'
    )

    local -a history_options
    history_options=(
        '--limit:Limit number of results'
        '--status:Filter by status'
        '--search:Search text'
    )

    local -a export_options
    export_options=(
        '--format:Output format (md|json)'
        '--output:Output file path'
    )

    local -a completion_options
    completion_options=(
        '--bash:Install bash completion'
        '--zsh:Install zsh completion'
        '--fish:Install fish completion'
        '--install:Install to shell config'
        '--uninstall:Uninstall completion'
    )

    local context curcontext state line
    typeset -A opt_args

    _arguments -C \
        '1: :->command' \
        '*:: :->options' && return

    case $state in
        command)
            _describe 'command' commands
            ;;
        options)
            case ${words[2]} in
                start)
                    _describe 'option' start_options
                    ;;
                history)
                    _describe 'option' history_options
                    ;;
                export)
                    _describe 'option' export_options
                    ;;
                completion)
                    _describe 'option' completion_options
                    ;;
            esac
            ;;
    esac
}

_orchestra
