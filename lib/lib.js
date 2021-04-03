var lib = {
    splitStr : function(str){
        return str.split(',')
    },
    encodeBase64 : function(data){                
        let buff = new Buffer(data)
        return buff.toString('base64')
    },
    decodeBase64 : function(data){
        let buff = new Buffer(data, 'base64')
        return buff.toString('ascii')
    },
    empty : function(data)
    {
      if(typeof(data) == 'number' || typeof(data) == 'boolean')
      { 
        return false; 
      }
      if(typeof(data) == 'undefined' || data === null)
      {
        return true; 
      }
      if(typeof(data.length) != 'undefined')
      {
        return data.length == 0;
      }
      var count = 0;
      for(var i in data)
      {
        if(data.hasOwnProperty(i))
        {
          count ++;
        }
      }
      return count == 0;
    }
}
module.exports = lib