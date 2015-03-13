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


function AndWhere() {

    this.binds  = [];
    this.bindNo = 1;
    this.where  = "";
    this.and    = "";
    this.or = "";
}

AndWhere.prototype.parseDDMMYY = function(str) {
    return str.replace(/(..)-(..)-(..)/, "20$3-$2-$1")
}


AndWhere.prototype.add = function(field, sql) {

    if (field) {
        this.binds.push( field );
        this.where += this.and + sql + " :" + this.bindNo++;
        this.and = " and "
    }
}

AndWhere.prototype.addY = function(sql) {

    this.where += this.and + sql + " = 'Y' ";
    this.and = " and "
}

AndWhere.prototype.orY = function(sql) {

    this.where += this.or + sql + " = 'Y' ";
    this.or = " or "
}


AndWhere.prototype.addN = function(sql) {

    this.where += this.and + sql + " = 'N' ";
    this.and = " and "
}

AndWhere.prototype.andIsNull = function(sql) {

    this.where += this.and + sql + " is null ";
    this.and = " and "
}

AndWhere.prototype.andIsNotNull = function(sql) {

    this.where += this.and + sql + " is not null ";
    this.and = " and "
}

AndWhere.prototype.orIsNull = function(sql) {

    this.where += this.or + sql + " is null ";
    this.or = " or "
}

AndWhere.prototype.addLike = function(field, sql) {

    if (field) {
        this.binds.push( field  + '%');
        this.where += this.and + sql + " like :" + this.bindNo++;
        this.and = " and "
    }
}

AndWhere.prototype.addIn = function(field, sql) {

    if (field) {
        this.where += this.and + sql + " in( " + field + ")";
        this.and = " and "
    }
}

AndWhere.prototype.addnotIn = function(field, sql) {

    if (field) {
        this.where += this.and + "(" + sql + " not in( " + field + ") or " + sql + " is null)";
        this.and = " and "
    }
}

AndWhere.prototype.addIStartsWith = function(field, sql) {

    if (field) {
        this.binds.push( field.toUpperCase()  + '%');
        this.where += this.and + "upper(" + sql + ") like :" + this.bindNo++;
        this.and = " and "
    }
}
AndWhere.prototype.addEq = function(field, sql) {

    if (field) {
        this.binds.push( field );
        this.where += this.and + sql + " = :" + this.bindNo++;
        this.and = " and "
    }
}

AndWhere.prototype.orEq = function(field, sql) {
    if (field) {
        this.binds.push( field );
        this.where += this.or + sql + " = :" + this.bindNo++;
        this.or = " or ";
        this.and = " and "
    }
}

AndWhere.prototype.orIn = function(field, sql) {

    if (field) {
        this.where += this.or + sql + " in( " + field + ")";
        this.or = " or "
    }
}

AndWhere.prototype.addGreaterThan = function(field, sql) {

    if (field) {
        this.binds.push( field  );
        this.where += this.and + sql + " > : " +  this.bindNo++ ;
        this.and = " and "
    }
}

AndWhere.prototype.addGreaterThanEq = function(field, sql) {

   if (field) {
        this.binds.push( field  );
        this.where += this.or + sql + " >= : " +  this.bindNo++ ;
        this.and = " and ";
        this.or = " or ";
    }
}

AndWhere.prototype.addLessThan = function(field, sql) {

    if (field) {
        this.binds.push( field  );
        this.where += this.and + sql + " < : " +  this.bindNo++ ;
        this.and = " and "
    }
}

AndWhere.prototype.addLessThanEq = function(field, sql) {

     if (field) {
        this.binds.push( field  );
        this.where += this.or + sql + " <= : " +  this.bindNo++ ;
        this.and = " and ";
        this.or = " or ";
    }
}

AndWhere.prototype.orLike = function(field, sql) {

    if (field) {
        this.binds.push( field  + '%');
        this.where += this.or + sql + " like :" + this.bindNo++;
        this.or = " or "
    }
}

AndWhere.prototype.orLikeToUpper = function(field, sql) {

    if (field) {
        this.binds.push( (field + '%').toUpperCase() );
        this.where += this.or + sql + " like :" + this.bindNo++;
        this.or = " or "
        this.and = " and "
    }
}

AndWhere.prototype.addSQL = function(fsql) {

    if (fsql.trim() != "") {
        this.where += this.and + "( " + fsql + " )"
        this.and = " and "
    }
}

AndWhere.prototype.addInEquality = function(field, sql) {

    if (field) {
        this.binds.push( field );
        this.where += this.and + sql + " <> :" + this.bindNo++;
        this.and = " and "
    }
}

AndWhere.prototype.addLtEq = function(field, sql) {

    if (field) {
        this.binds.push( field  );
        this.where += this.and + sql + " <= " + "to_date(:" + this.bindNo++ + ",'DD-MM-YY')";
        this.and = " and "
    }
}
AndWhere.prototype.addDateGtEq = function(field, sql) {

    if (field) {
        this.binds.push( this.parseDDMMYY(field) );
        this.where += this.and + sql + " >= " + ":" + this.bindNo++;
        this.and = " and "
    }
}
AndWhere.prototype.addDateLtEq = function(field, sql) {

    if (field) {
        this.binds.push( this.parseDDMMYY(field) );
        this.where += this.and + sql + " <= " + ":" + this.bindNo++ ;
        this.and = " and "
    }
}

AndWhere.prototype.addDateLtEqSysyDate = function(sql) {

    this.where += this.and + sql + " <= sysdate" ;
    this.and = " and "

}

AndWhere.prototype.addGtEq = function(field, sql) {

    if (field) {
        this.binds.push( field  );
        this.where += this.and + sql + " >= " + "to_date(:" + this.bindNo++ + ",'DD-MM-YY')";
        this.and = " and "
    }
}

AndWhere.prototype.addDateLtEqCurrentDate= function( sql ) {
    this.where += this.and + sql + " <= (current_date)" ;
    this.and = " and "
}

AndWhere.prototype.ORLike  = function(field, sql ) {
    if (field) {
        this.binds.push( field  + '%');
        this.where += this.and + sql + " like :" + this.bindNo++  ;
        this.or = " or "
    }
}

AndWhere.prototype.addORLike  = function(field, sql1 ,sql2) {
    if (field) {
        this.binds.push( field  + '%');
        this.where += this.and + sql1 + " like :" + this.bindNo + " OR " + sql2 + " like :" + this.bindNo++ ;
        this.and = " and "
    }
}
AndWhere.prototype.addBetween = function(field,sql) {
    if (field) {
      this.binds.push(field );
      this.where += this.and + sql + " between " + "trunc(sysdate- :" + this.bindNo++ + ") and trunc(sysdate)";
      this.and = " and "
    }
}
AndWhere.prototype.addDateBetween = function(field,sql) {
    if (field) {
      var d = new Date()
      var today = d.toISOString().substring(0,10)
      d.setDate(d.getDate()-field)
      var startDate = d.toISOString().substring(0,10)
      this.binds.push(field );
      this.where += this.and + sql + " >= '"+startDate+"' and " + sql + " <= '"+today+"' ";
      this.and = " and "
    }
}

AndWhere.prototype.orEqToUpper = function(field, sql) {

    if (field) {
        this.binds.push( field.toUpperCase() );
        this.where += this.or + sql + " = :" + this.bindNo++;
        this.or = " or "
    }
}


/*----------------------------------------------------------------------------
|   simple functions which don't use bind variables, but the values
|   directly (literally) into the SQL string
|
\---------------------------------------------------------------------------*/

function AndWhereDirect() {

    this.where  = "";
    this.and    = "";
}

function sqlQuote(str)
{
    return str.replace(/'/, "''")
}
function sqlDQuote(str)
{
    return "'"+sqlQuote(str)+"'";
}

AndWhereDirect.prototype.parseDDMMYY = function(str) {
    return str.replace(/(..)-(..)-(..)/, "20$3-$2-$1")
}


AndWhereDirect.prototype.addY = function(sql) {

    this.where += this.and + sql + " = 'Y' ";
    this.and = " and "
}

AndWhereDirect.prototype.addN = function(sql) {

    this.where += this.and + sql + " = 'N' ";
    this.and = " and "
}

AndWhereDirect.prototype.addLike = function(field, sql) {

    if (field) {
        this.where += this.and + sql + " like '" + sqlQuote(field) + "%'";
        this.and = " and "
    }
}
AndWhereDirect.prototype.addIStartsWith = function(field, sql) {

    if (field) {
        this.where += this.and + sql + " istartswith " + sqlDQuote(field);
        this.and = " and "
    }
}
AndWhereDirect.prototype.addEq = function(field, sql) {

    if (field) {
        this.where += this.and + sql + " = " + sqlDQuote(field);
        this.and = " and "
    }
}
AndWhereDirect.prototype.addDateGtEq = function(field, sql) {

    if (field) {
        this.where += this.and + sql + " >= " + sqlDQuote(this.parseDDMMYY(field))
        this.and = " and "
    }
}

AndWhereDirect.prototype.addDateGt = function(field, sql) {

    if (field) {
        this.where += this.and + sql + " > " + sqlDQuote(field)
        this.and = " and "
    }
}

AndWhereDirect.prototype.addDateLtEq = function(field, sql) {

    if (field) {
        this.where += this.and + sql + " <= " + sqlDQuote(this.parseDDMMYY(field))
        this.and = " and "
    }
}
AndWhereDirect.prototype.addDateBetween = function(field,sql) {
    if (field) {
      var d = new Date()
      var today = d.toISOString().substring(0,10)
      d.setDate(d.getDate()-field)
      var startDate = d.toISOString().substring(0,10)
      this.where += this.and + sql + " >= '"+startDate+"' and " + sql + " <= '"+today+"' ";
      this.and = " and "
    }
}



/*----------------------------------------------------------------------------
|   simple functions which don't use bind variables, but the values
|   directly (literally) into the SQL string
|
\---------------------------------------------------------------------------*/
function OrWhereDirect() {

    this.where = ""
    this.or    = ""
}


OrWhereDirect.prototype.parseDDMMYY = function(str) {
    return str.replace(/(..)-(..)-(..)/, "20$3-$2-$1")
}


OrWhereDirect.prototype.addY = function(sql) {

    this.where += this.or + sql + " = 'Y' ";
    this.or = " or "
}

OrWhereDirect.prototype.addN = function(sql) {

    this.where += this.or + sql + " = 'N' ";
    this.or = " or "
}

OrWhereDirect.prototype.addLike = function(field, sql) {

    if (field) {
        this.where += this.or + sql + " like '" + sqlQuote(field) + "%'";
        this.or = " or "
    }
}
OrWhereDirect.prototype.addIStartsWith = function(field, sql) {

    if (field) {
        this.where += this.or + sql + " istartswith " + sqlDQuote(field);
        this.or = " or "
    }
}
OrWhereDirect.prototype.addEq = function(field, sql) {

    if (field) {
        this.where += this.or + sql + " = " + sqlDQuote(field);
        this.or = " or "
    }
}
OrWhereDirect.prototype.ORIn = function(field, sql) {

    if (field) {
        this.where += this.or + sql + " in( " + field + ")";
        this.or = " or "
    }
}

OrWhereDirect.prototype.addDateGtEq = function(field, sql) {

    if (field) {
        this.where += this.or + sql + " >= " + sqlDQuote(this.parseDDMMYY(field))
        this.or = " or "
    }
}
OrWhereDirect.prototype.addDateLtEq = function(field, sql) {

    if (field) {
        this.where += this.or + sql + " <= " + sqlDQuote(this.parseDDMMYY(field))
        this.or = " or "
    }
}
OrWhereDirect.prototype.addDateBetween = function(field,sql) {
    if (field) {
      var d = new Date()
      var today = d.toISOString().substring(0,10)
      d.setDate(d.getDate()-field)
      var startDate = d.toISOString().substring(0,10)
      this.where += this.or +' ( ' + sql + " >= '"+startDate+"' and " + sql + " <= '"+today+"' ) ";
      this.or = " or "
    }
}
OrWhereDirect.prototype.addSQL = function(fsql) {

    if (fsql.trim() != "") {
        this.where += this.or + "( " + fsql + " )"
        this.or = " or "
    }
}
OrWhereDirect.prototype.orIn = function(fields, sql) {

    if (fields && fields.length > 0) {
        this.where += this.or + sql + " in ("
        var comma = ''
        var closing = ''
        for (var i=0; i < fields.length; i++ ) {
            this.bind.binds.push( fields[i] );
            this.where += comma + sqlDQuote(field)
            comma = ','
            closing = ')'
        }
        this.where += closing
        this.or = " or "
    }
}




module.exports.AndWhere       = AndWhere;
module.exports.AndWhereDirect = AndWhereDirect;
module.exports.OrWhereDirect = OrWhereDirect;

