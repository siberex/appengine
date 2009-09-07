var datastore = require("google/appengine/api/datastore"),
    JDatastore = datastore.Datastore,
    JQuery = datastore.Query,
	JFetchOptions = Packages.com.google.appengine.api.datastore.FetchOptions,
	JFetchOptionsBuilder = Packages.com.google.appengine.api.datastore.FetchOptions.Builder;

var entityToObject = require("google/appengine/ext/db/utils").entityToObject;

var DESCENDING = JQuery.SortDirection.DESCENDING;

/**
 * The Query class is a datastore query interface that uses objects and methods 
 * to prepare queries.
 */
var Query = exports.Query = function(constructor, keysOnly) {
    this.model = constructor.model;
    this.query = new JQuery(this.model.kind);
    if (keysOnly) this.query.setKeysOnly();
}

var FILTER_OPERATORS = {
	"=": JQuery.FilterOperator.EQUAL,
	">": JQuery.FilterOperator.GREATER_THAN,
	">=": JQuery.FilterOperator.GREATER_THAN_OR_EQUAL,
	"<": JQuery.FilterOperator.LESS_THAN,
	"<=": JQuery.FilterOperator.LESS_THAN_OR_EQUAL
}

/**
 * Adds a property condition filter to the query. Only entities with properties 
 * that meet all of the conditions will be returned by the query.
 */
Query.prototype.filter = function(property_op, value) {
	var parts = property_op.split(" ");
	var property = this.model.properties[parts[0]];
	var obj = {};
	obj[property.name] = value;
	this.query.addFilter(parts[0], FILTER_OPERATORS[parts[1]], property.getValueForDatastore(obj));
    return this;
}

/**
 * Adds an ordering for the results. Results are ordered starting with the first 
 * order added.
 * @arguments:
 * property
 *   A string, the name of the property to order. To specify that the order 
 *   ought to be in descending order, precede the name with a hyphen (-). Without 
 *   a hyphen, the order is ascending. 
 */
Query.prototype.order = function(property) {
    if (property.begins("-"))
        this.query.addSort(property.slice(1), DESCENDING);
    else
        this.query.addSort(property);
    return this;
}

Query.prototype.ancestor = function(ancestor) {
    this.query.setAncestor(resolveKey(ancestor));
    return this;
}

Query.prototype.keysOnly = function() {
    this.query.setKeysOnly();
    return this;
}

Query.prototype.limit = function(limit) {
	this.fetchOptions = JFetchOptionsBuilder.withLimit(limit);
	return this;
}

Query.prototype.offset = function(offset) {
	if (!this.fetchOptions) throw Error("Call .limit(n) before calling .offset(n)");
	this.fetchOptions = this.fetchOptions.offset(offset);
	return this;
}

Query.prototype.get = function() {
    if (!this.prepared) this.prepared = JDatastore.prepare(this.query);

	entities = this.prepared.asIterator(JFetchOptionsBuilder.withLimit(1));

    if (this.query.isKeysOnly())
	    for (var e in Iterator(entities))
	    	return e.getKey();
    else
	    for (var e in Iterator(entities))
	    	return entityToObject(e);
}

/**
 *
 */
Query.prototype.fetch = function(limit, offset) {
    if (!this.prepared) this.prepared = JDatastore.prepare(this.query);

    var objects = [];
    
    var entities;
    if (this.fetchOptions) 
    	entities = this.prepared.asIterator(this.fetchOptions);
    else
    	entities = this.prepared.asIterator();
    
    if (this.query.isKeysOnly())
	    for (var e in Iterator(entities))
	    	objects.push(e.getKey());
    else
	    for (var e in Iterator(entities))
	    	objects.push(entityToObject(e));

    return objects;    
}

Query.prototype.keys = function(limit, offset) {
	this.query.setKeysOnly();
	return this.fetch();
}

Query.prototype.forEach = function() {
}

Query.prototype.count = function(limit) {
}
