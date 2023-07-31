import type {JestConfigWithTsJest} from 'ts-jest'

const config: JestConfigWithTsJest = {
    preset: "ts-jest/presets/default-esm",
    extensionsToTreatAsEsm: [".ts"],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    transform: {
        "^.+\\.(ts|tsx)?$": [
            "ts-jest",
            {
                tsconfig: "tsconfig.json",
                useESM: true,
            },
        ],
    },
    testEnvironment: "node",

    // COVERAGE
    collectCoverage: true,
    collectCoverageFrom: [
        "**/src/**/*.ts",
        "!**/node_modules/**",
        "!**/vendor/**",
    ],
    coverageDirectory: "coverage",
    coverageReporters: ["json", "lcov", "text", "clover", "cobertura"],
    testPathIgnorePatterns: [
        '/node_modules/',
        '/dist/'
    ]
};

export default config;
