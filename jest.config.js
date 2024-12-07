module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom', //para testes localstorage e indexeddb
    roots: ['<rootDir>/tests'],
    // setupFiles: [
    //     "fake-indexeddb/auto"
    // ],
    coveragePathIgnorePatterns: [
        "/node_modules/",
        "dist"
    ]
};
