const { Features, Surveys } = require('./features');

const testSurvey = new Surveys(
    [
        'one three three',
        'four five',
        'seven seven',
        'eight eight'
    ],
    ['uuid1','uuid2','uuid3','uuid4']);

console.assert(
    testSurvey.allWords['one'] == 1 &&
    testSurvey.allWords['three'] == 2,
    'allWords');

console.assert(
    testSurvey.surveyWords[0][0] == 'one' &&
    testSurvey.surveyWords[0][2] == 'three' &&
    testSurvey.surveyWords[1][0] == 'four',
    'surveyWords');

console.assert(
    testSurvey.word_meets_tfidf(2, 4),
    'word_meets_tfidf');

const wordsToInclude = testSurvey.words_to_include();
console.assert(
    wordsToInclude[0] == 'three' &&
    wordsToInclude[1] == 'seven' &&
    wordsToInclude[2] == 'eight' &&
    wordsToInclude.length == 3,
    'words_to_include')

const wordMatrix = testSurvey.word_matrix();
console.assert(
    wordMatrix[0][0] == 2 &&
    wordMatrix[0][1] == 0 &&
    wordMatrix[0][2] == 0 &&
    wordMatrix[2][0] == 0 &&
    wordMatrix[2][1] == 2 &&
    wordMatrix[2][2] == 0 &&
    wordMatrix[3][0] == 0 &&
    wordMatrix[3][1] == 0 &&
    wordMatrix[3][2] == 2,
    'word_matrix');

const largeMatrix = [[0,0,1,2,1,0],[0,1,1,0,0,2],[2,2,2,0,1,0],[1,2,1,0,0,2]]
const wordStrings = ['one','two','three','four','five','six'];
const surveysStub = {
    word_matrix: () => { return largeMatrix; },
    words_to_include: () => { return wordStrings; },
    length: 4,
    strArr: ['doc one','doc two','doc three','doc four'],
    srvys: [['uuid1','doc one'],['uuid2','doc two'],['uuid3','doc three'],['uuid4','doc four']]
}
const num_features = 3;
const feats = new Features(surveysStub, num_features);

console.assert(
    feats.wMatrix.length == largeMatrix.length &&
    feats.hMatrix[0].length == largeMatrix[0].length &&
    feats.wMatrix[0].length == num_features &&
    feats.hMatrix.length == num_features
    , 'Features wMatrix and hMatrix');

console.assert(
    feats.num_features == feats.hMatrix.length,
    'num_features');

console.assert(
    feats.num_words == feats.hMatrix[0].length &&
    feats.num_words == feats.wordsToInclude.length,
    'num_words');

const firstFeatureWordWeights = feats.word_feature_weights(0);
console.assert(
    firstFeatureWordWeights.length == wordStrings.length,
    'word_feature_weights');
for (let i=0; i<firstFeatureWordWeights.length-1; i++) {
    console.assert(firstFeatureWordWeights[i][0] >= firstFeatureWordWeights[i+1][0],
        `word_feature_weights sorted (item ${i})`);
}
let mostImportantWords = [];
for (let i=0; i<feats.num_features; i++) {
    const importantWord = feats.word_feature_weights(i)[0][1];
    mostImportantWords.push(importantWord);
}
mostImportantWords = mostImportantWords.sort();
const expectedMostImportantWords = ['one','four','six'].sort();
for (let i=0; i<mostImportantWords.length; i++) {
    console.assert(
        mostImportantWords[i] == expectedMostImportantWords[i],
        `features reliably identify most important words: ${i}:${mostImportantWords[i]}/${expectedMostImportantWords[i]}`);
}

const firstFeatureDocWeights = feats.survey_feature_weights(0);
console.assert(
    firstFeatureDocWeights.length == feats.surveys.length,
    'survey_feature_weights');
for (let i=0; i<firstFeatureDocWeights.length-1; i++) {
    console.assert(firstFeatureDocWeights[i][0] >= firstFeatureDocWeights[i+1][0],
        `survey_feature_weights sorted (item ${i})`);
}
let mostImportantDocs = [];
for (let i=0; i<feats.surveys.length; i++) {
    const importantWord = feats.survey_feature_weights(i)[0][1];
    mostImportantDocs.push(importantWord);
}
const fByW = feats.top_patterns_by_weight();
console.assert(fByW[0][0] > fByW[1][0] && fByW[1][0] > fByW[2][0]);


console.log('All tests pass!');
