/*----------------------------------------------------------------------------
|
|   some helpers to build WHERE clauses with bind variables
|
|
|
|   written by Jochen Loewer
|   April 2013
|
\---------------------------------------------------------------------------*/


function Bind(start) {


    this.binds  = [];
    this.bindNo = start ? start : 1;
}

function And(bindObj) {

    this.bind  = bindObj;
    this.where = "";
    this.and   = "";
}

function Or(bindObj) {

    this.bind  = bindObj;
    this.where = "";
    this.or    = "";
}


Or.prototype.orEq = function(field, sql) {

    if (field) {
        this.bind.binds.push( field );
        this.where += this.or + sql + " = :" + this.bind.bindNo++;
        this.or = " or "
    }
}
Or.prototype.orIn = function(fields, sql) {

    if (fields && fields.length > 0) {
        this.where += this.or + sql + " in ("
        var comma = ''
        var closing = ''
        for (var i=0; i < fields.length; i++ ) {
            this.bind.binds.push( fields[i] );
            this.where +=  comma+ ":" + this.bind.bindNo++;
            comma = ','
            closing = ')'
        }    
        this.where += closing
        this.or = " or "
    }
}

Or.prototype.addSQL = function(fsql) {

    if (fsql.trim() != "") {
        this.where += this.or + "( " + fsql + " )"
        this.and = " or "
    }
}


And.prototype.addSQL = function(fsql) {

    if (fsql.trim() != "") {
        this.where += this.and + "( " + fsql + " )"
        this.and = " and "
    }
}

And.prototype.add = function(field, sql) {

    if (field) {
        this.bind.binds.push( field );
        this.where += this.and + sql + " :" + this.bind.bindNo++;
        this.and = " and "
    }
}

And.prototype.addLike = function(field, sql) {

    if (field) {
        this.bind.binds.push( field  + '%');
        this.where += this.and + sql + " like :" + this.bind.bindNo++;
        this.and = " and "
    }
}
And.prototype.addEq = function(field, sql) {

    if (field) {
        this.bind.binds.push( field );
        this.where += this.and + sql + " = :" + this.bind.bindNo++;
        this.and = " and "
    }
}
And.prototype.addLtEq = function(field, sql) {

    if (field) {
        this.bind.binds.push( field  );
        this.where += this.and + sql + " <= " + "to_date(:" + this.bind.bindNo++ + ",'DD-MM-YY')";
        this.and = " and "
    }
}
And.prototype.addGtEq = function(field, sql) {

    if (field) {
        this.bind.binds.push( field  );
        this.where += this.and + sql + " >= " + "to_date(:" + this.bind.bindNo++ + ",'DD-MM-YY')";
        this.and = " and "
    }
}
And.prototype.addORLike  = function(field, sql1 ,sql2) {
    if (field) {
        this.bind.binds.push( field  + '%');
        this.where += this.and + sql1 + " like :" + this.bind.bindNo + " OR " + sql2 + " like :" + this.bind.bindNo++ ;
        this.and = " and "
    }
}
And.prototype.addBetween = function(field,sql) {
    if (field) {
      this.bind.binds.push(field );
      this.where += this.and + sql + " between " + "trunc(sysdate- :" + this.bind.bindNo++ + ") and trunc(sysdate)";
      this.and = " and "
    }
}
And.prototype.addEqList = function(fArray,sql) {

    if (fArray.length && fArray.length > 0) {

      this.where += this.and + "(";
      var or = '';
      for(var i=0; i < fArray.length; i++) {
          this.bind.binds.push ( fArray[i] );
          this.where += " " + or + sql + " = :" + this.bind.bindNo++;
          or = 'or';
      }
      this.where += ")"
      this.and = " and "
    }
}

And.prototype.orEqToUpper = function(field, sql) {
    console.log('in sqlutils ' + field);
    if (field) {
        this.bind.binds.push( field.toUpperCase() );
        this.where += this.or + sql + " = :" + this.bind.bindNo++;
        this.or = " or "
    }
}

And.prototype.orEq = function(field, sql) {
    console.log('in sqlutils ' + field);
    if (field) {
        this.bind.binds.push( field );
        this.where += this.or + sql + " = :" + this.bind.bindNo++;
        this.or = " or "
    }
}

module.exports.Bind = Bind;
module.exports.Or   = Or;
module.exports.And  = And;

