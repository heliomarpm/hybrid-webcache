module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    coveragePathIgnorePatterns: [
        "/node_modules/",
        "dist"
    ]
};
