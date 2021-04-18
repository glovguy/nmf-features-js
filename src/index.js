let mydata = require('./nlp/testData');
let myUuids = ['u1','u2','u3','u4','u5','u6','u7'];
let feat = require('./nlp/models/features');

// let survs = new feat.Surveys(mydata, myUuids);
// let feats = new feat.Features(survs, 3);

// feats.print_features();
// const result = survs.word_matrix();

window.display_analysis = function(fileStrings, fileUuids, numFeatures) {
  const resultDisplayDiv = document.querySelector('#analysis-output');
  resultDisplayDiv.innerHTML = "Loading...";

  let survs = new feat.Surveys(fileStrings, fileUuids);
  let feats = new feat.Features(survs, numFeatures);
  const result = survs.word_matrix();

  resultDisplayDiv.innerHTML = feats.features_as_html();
}
