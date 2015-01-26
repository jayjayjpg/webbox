import Ember from 'ember';

export function abstract(input) {
	var clippedString = input.substring(0,320);
	clippedString += "...";
	return clippedString;
}

var abstractHelper = Ember.Handlebars.makeBoundHelper(abstract);
 
export default abstractHelper;
 
