const ml = require('machine_learning');
const stopwords = require('./stopwords');


function num_item_in_array(item, arr) {
    var count = 0;
    for (var i = 0; i < arr.length; ++i){
        if (arr[i] == item) { count++; }
    }
    return count;
}

class Surveys {
    constructor(strArr,uuids) {
        this.strArr = strArr;
        this.srvys = [];
        for (let i=0; i<this.strArr.length; i++) {
            const uuid = uuids ? uuids[i] : undefined;
            this.srvys.push([uuid, strArr[i]]);
        }
        this.allWords = {};
        this.surveyWords = {};
        this.strArr.forEach((srvy, i) => {
            const words = this.words_from_survey(srvy);
            this.surveyWords[i] = words;
            words.forEach((word) => this.add_word_to_all_words(word));
        });
    }

    words_from_survey(srvy) {
        return srvy.split(' ').map(w => w.trim()).map(word => word.toLowerCase());
    }

    add_word_to_all_words(word) {
        this.allWords[word] = this.allWords[word] ? this.allWords[word]+1 : 1;
    }

    get length() {
        return this.strArr.length;
    }

    words_to_include() {
        let wordsToInclude = [];
        const numSurveys = this.length;
        for (let word in this.allWords) {
            const totalCount = this.allWords[word];
            if (this.word_meets_tfidf(totalCount, numSurveys) && !stopwords.is_stopword(word)) {
                wordsToInclude.push(word)
            }
        }
        return wordsToInclude;
    }

    word_meets_tfidf(wordCount, countInSurvey) {
        return wordCount > 1 && wordCount < countInSurvey * 0.6;
    }

    word_matrix() {
        let wordMatrix = [];
        const wordsToInclude = this.words_to_include();
        for (let i=0; i<this.length; i++) {
            wordMatrix.push(wordsToInclude.map(word => {
                const srvyWrds = this.surveyWords[i];
                return srvyWrds.includes(word) ? num_item_in_array(word, srvyWrds) : 0;
            }));
        }
        return wordMatrix;
    }
}
exports.Surveys = Surveys;

class Features {
    constructor(surveys, num_features) {
        this.surveys = surveys;
        this.num_features = num_features;
        this.wordMatrix = this.surveys.word_matrix();
        this.wordsToInclude = this.surveys.words_to_include();
        this.num_words = this.wordMatrix[0].length;
        [this.wMatrix,this.hMatrix] = ml.nmf.factorize({
            matrix : this.wordMatrix,
            features : this.num_features,
            epochs : 100
        });
    }

    print_features() {
        console.log(this.features());
    }

    features() {
        const resultFeatures = [];
        for (let i=0; i<this.num_features; i++) {
            resultFeatures.push(`\nImportant words for feature ${i}:`);
            this.word_feature_weights(i).slice(0,6).forEach(weightPair => {
                resultFeatures.push(`\t${weightPair[1]} \t ${weightPair[0]}`);
            });
        }
        for (let i=0; i<this.num_features; i++) {
            resultFeatures.push(`\nImportant docs for feature ${i}:`);
            this.survey_feature_weights(i).slice(0,3).forEach(weightPair => {
                const srvyText = this.surveys.srvys.find(s => s[0] == weightPair[1])[1];
                resultFeatures.push(`\t${srvyText} \n\t ${weightPair[0]}`);
            });
        }
        return resultFeatures.join('\n');
    }
    features_as_html() {
        const resultStr = ['<hr />'];
        for (let i=0; i<this.num_features; i++) {
            // Important Words //

            resultStr.push(`<h2>Feature ${i}</h2>`);
            resultStr.push(`<h4>Important words for feature ${i}</h4>`);
            resultStr.push('<table width="25%">');
            resultStr.push(`<tr><th>Word</th><th>Weight</th></tr>`);
            this.word_feature_weights(i).slice(0,6).forEach(weightPair => {
                resultStr.push(`<tr><td>${weightPair[1]}</td><td>${weightPair[0]}</td></tr>`);
            });
            resultStr.push('</table>');

            // Important Docs //
            resultStr.push(`<h2>Feature ${i}</h2>`);
            resultStr.push(`<h4>Important docs for feature ${i}</h4>`);
            resultStr.push('<table width="25%">');
            resultStr.push(`<tr><th>Filename</th><th>Weight</th></tr>`);
            this.survey_feature_weights(i).slice(0,3).forEach(weightPair => {
                const srvyUuid = this.surveys.srvys.find(s => s[0] == weightPair[1])[0];
                resultStr.push(`<tr><td>${srvyUuid}</td><td>${weightPair[0]}</td></tr>`);
            });
            resultStr.push('</table> <hr />');
        }
        return resultStr.join('\n');
    }

    word_feature_weights(featureIndex) {
        let wordFeatureWeights = [];
        for (let i=0; i<this.num_words; i++) {
            const wordString = this.wordsToInclude[i];
            const weight = this.hMatrix[featureIndex][i];
            wordFeatureWeights.push([weight, wordString]);
        }
        return wordFeatureWeights.sort((a,b) => (b[0]-a[0]));
    }

    survey_feature_weights(featureIndex) {
        let surveyFeatureWeights = [];
        for (let i=0; i<this.surveys.length; i++) {
            const docUuid = this.surveys.srvys[i][0];
            const weight = this.wMatrix[i][featureIndex];
            surveyFeatureWeights.push([weight, docUuid]);
        }
        return surveyFeatureWeights.sort((a,b) => (b[0]-a[0]));
    }

    top_patterns_by_weight() {
        if (this.topPatterns) { return this.topPatterns; }
        this.topPatterns = []
        for (let i=0; i<this.num_features; i++) {
            this.topPatterns.push(...this.survey_feature_weights(i));
        }
        return this.topPatterns.sort((a,b) => { return (b[0]-a[0]); });
    }

    print_surveys() {
        for (let i=0; i<this.surveys.srvys.length || i>30; i++) {
            console.log(`\n${this.surveys.srvys[i][1]}`);
            this.top_patterns_by_weight().slice(0,3).forEach(w => {
                const survey = this.surveys.srvys.find(s => s[0] == w[1]);
                console.log(`\t${w[0]}\t${survey[1]}`);
            });
        }
    }
}
exports.Features = Features;
