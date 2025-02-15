module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom', //para testes localstorage e indexeddb
    roots: ['<rootDir>/test'],
    // setupFiles: [
    //     "fake-indexeddb/auto"
    // ],
    coveragePathIgnorePatterns: [
        "/node_modules/",
        "dist"
    ],
    "moduleNameMapper": {
        "@/(.*)$": "<rootDir>/src/$1"
     }
};
