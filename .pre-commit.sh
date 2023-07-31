#!/bin/bash

set -u

first_cmd_executed=0

run_cmd()
{
    if [ $first_cmd_executed -eq 1 ]; then
        echo -en "\n"
        printf '%.0s⎯' {1..80}; echo
        echo -en "\n"
    fi

    first_cmd_executed=1

    echo -e "\033[1;37m$1\033[0m\n\033[1m\$\033[0m ${2:-$1}\n"

    bash -c "${2:-$1}"

    exit_code=$?

    echo ""

    if [ $exit_code -eq 0 ]; then
        echo -e "\033[1;32mCommand was successful\033[0m"
    else
        echo -e "\033[1;31mCommand Failed with status: \033[46m$exit_code\033[0m"
        exit $exit_code
    fi
}

run_cmd \
    "Render .gitlab-ci.yml using Docker Recipe." \
    "docker-recipe -t ./.gitlab-ci.j2.yml -o .gitlab-ci.yml"

run_cmd "npm install"

run_cmd "npm run prettier:fix"

run_cmd "npm run prettier:check"

run_cmd "npm run eslint:fix"

run_cmd "npm run eslint:check"

run_cmd "npm run build"

run_cmd "npm run test"

if [[ $(git rev-parse --abbrev-ref HEAD) == feature/* ]]; then
    run_cmd "npm update"

    # Sometime, maybe.
    # run_cmd "npm outdated"
    # run_cmd "npm audit --audit-level=moderate"
fi
