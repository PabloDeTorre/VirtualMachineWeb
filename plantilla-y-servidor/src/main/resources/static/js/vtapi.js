"use strict"

// uses ES6 module notation (export statement is at the very end)
// see https://medium.freecodecamp.org/anatomy-of-js-module-systems-and-building-libraries-fadcd8dbd0e

/**
* Valid states and actions.
*/
const Action = {
  START: 'start',
  STOP: 'stop',
  SUSPEND: 'suspend',
  RESET: 'reset'
}

/**
* A set of VMs, possibly grouped. 
* Groups may contain other groups, no names (of either VMs or groups)
* will be duplicated, and VMs and groups may appear in several VMs
* and groups.
*/
class GlobalState {
  /**
  * Creates a GlobalState from its component VMs and Groups
  * @param {Params[]} vms initial vms
  * @param {Group[]} groups initial groups
  */
  constructor(vms, groups) {
    this.vms = vms;
    this.groups = groups;
  }
}

/**
* A group of VMs.
*/
class Group {
  /**
  * Creates a Group, which starts empty
  * @param {String} name
  */
  constructor(name) {
    this.name = name;
    this.members = []; // names of vms or groups
   }
}

/**
* Parameters for a VM.
* Used to initialize, describe and modify parameters.
* You can extend this declaring your own extension class: see
* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/extends
*/
class Params {
  /**
  * Creates a Params object.
  * You can leave any value empty (setting it to undefined)
  * undefined values are useful when setting values for groups or 
  * multiple vms at the same time.
  * @param {String} name
  * @param {Number} ram in kb
  * @param {Number} hdd in kb
  * @param {Number} cpu as percentage of max
  * @param {String} ip, in IPv4 dotted-decimal notation
  * @param {String} iso, the name of an existing iso-file to be used as DVD contents
  * @param {String} action, one of the valid actions.
  */
  constructor(name, ram, hdd, cpu, cores, ip, iso, action) {
    this.name = name;
    this.ram = Params.checkRange(ram, 1024, 1024*64, "ram");
    this.hdd = Params.checkRange(hdd, 1024, undefined, "hdd");
    this.cpu = Params.checkRange(cpu, 0, 100, "cpu");
    this.cores = Params.checkRange(cpu, 1, undefined, "cores");
    this.ip = Params.checkIp(ip);
    this.iso = iso;
    this.action = action;
    this.status = Action.STOP;
  }

  static checkAction(a) {
    const valid = Object.values(Action);
    if (a === undefined) {
      return;
    }
    if (valid.indexOf(a) === -1) {
      throw Error(
        "Invalid action name " + a + 
        ", expected one of " + valid.join(", "));
    }
  }

  // min and max form an inclusive range
  static checkRange(num, min, max, errName) {
    if (num === undefined) {
      // some methods will allow blank (=undefined) fields
      return;
    }
    let ok = true &&
      Number.isInteger(num) &&
      num >= min &&
      (max === undefined || num <= max);
    if ( ! ok) {
      throw Error(
        "Invalid value " + num + " for " + errName +
        ((max !== undefined) ? 
        ", expected integer  between " + min + " and " + max :
        " greater than " + min));
    } else {
      return num;
    }
  }

  // ipv4 validation
  static checkIp(ip) {
    // regexp from from https://stackoverflow.com/a/30520584/15472
    const zeroTo255 = '([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])';
    const ipv4 = new RegExp(['^',
    zeroTo255, '\\.', zeroTo255, '\\.', zeroTo255, '\\.', zeroTo255,
    '$'].join(''));

    if ( ! ipv4.test(ip)) {
      throw Error(
        "Invalid IPv4 address: " + ip);
    } else {
      return ip;
    }
  }
}

// uploads json via GET or POST and expects json in return
function send(url, method, data = {}) {
  let params = {
    method: method, // POST, GET, POST, PUT, DELETE, etc.
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(data)	  
  };  
  if (method === "GET") {
	  // GET requests cannot have body; I could URL-encode, but it would not be used here
	  delete params.body;
  } 
  console.log("sending", url, params)
  return fetch(url, params)
  .then(response => response.json()) // parses response to JSON
  .catch(error => console.error('Error:', error))
}

// uploads key-values from data, and file: contentsOfFileField, via POST
function upload(url, data, fileField) {
  const formData = new FormData();
  formData.append('file', fileField.files[0]);
  for (let [key, value] of data) {
    formData.append(key, value);
  }
  fetch(url + '/file/' + fileField.files[0], {
    method: 'POST',
    body: formData
  })
  .then(response => response.json()) // parses response to JSON
  .catch(error => console.error('Error:', error))
}

/**
* retrieves lists of vms and groups
* @param {String} conn url (with apikey as last path element) of endpoint
* @throws {Exception} on error or other failure
*/
function list(conn, options) {
  return send(conn + '/list', "GET");
}

/**
* lists valid uploaded files
* note: to read it, use GET request to same full URL
* @param {String} conn url (with apikey as last path element) of endpoint
* @throws {Exception} on error or other failure
*/
function listfiles(conn, options) {
  return send(conn + '/file', "GET");
}

/**
* removes an uploaded file
* @param {String} conn url (with apikey as last path element) of endpoint
* @throws {Exception} on error or other failure
*/
function rmfile(conn, options, name) {
  return send(conn + '/file/' + name, "DELETE");
}


/**
* adds a machine
* @param {String} conn url (with apikey as last path element) of endpoint
* @param {Params} options for chosen VM. All must be set.
* @throws {Exception} on error or other failure
*/
function add(conn, options) {
  return send(conn + '/add', "POST", options);
}

/**
* imports a machine
* @param {String} conn url (with apikey as last path element) of endpoint
* @param {String} name of machine that will be created
* @param {Element} fileField, a file input element (<input type='file'>)
* @throws {Exception} on error or other failure
*/
function vtimport(conn, name, fileField) {
  return response = upload(conn + '/import', {name: name}, fileField);
}

/**
* exports a machine to a file. The file's URL is reported in the
* response, and must be retrieved separately. Clients can have at most
* 1 export file.
* @param {String} conn url (with apikey as last path element) of endpoint
* @param {String} name of machine that will be created
* @throws {Exception} on error or other failure
*/
function vtexport(conn, name) {
  return response = send(conn + '/export', {name: name});
}

/**
* changes options for one or more machines
* @param {String} conn url (with apikey as last path element) of endpoint
* @param {Params} options for chosen VM. Use 'undefined' to ignore some
* @param {String[]} names of VMs to modify
* @throws {Exception} on error or other failure
*/
function set(conn, options, names) {
  options.names = names;
  return send(conn + '/set', "POST", options);
}

/**
* removes one or more vms or vm groups
* @param {String} conn url (with apikey as last path element) of endpoint
* @param {String[]} names of VMs to remove
* @throws {Exception} on error or other failure
*/
function rm(conn, names) {
  return send(conn + '/rm', "POST", {name: 'toRemove', elements: names});
}

/**
* links  properties of one or more vms or vm groups
* @param {String} conn url (with apikey as last path element) of endpoint
* @param {String[]} sources, with names of VMs or groups to add to target group
* @param {String} targetGroup to add them into
* @throws {Exception} on error or other failure
*/
function link(conn, vms, groupName) {
  return send(conn + '/link', "POST", {name: groupName, elements: vms});
}

/**
* links  properties of one or more vms or vm groups
* @param {String} conn url (with apikey as last path element) of endpoint
* @param {String[]} sources, with names of VMs or groups to add to target group
* @param {String} targetGroup to add them into
* @throws {Exception} on error or other failure
*/
function unlink(conn, vms, groupName) {
  return send(conn + '/unlink', "POST", {name: groupName, elements: vms});
}

// lists symbols that will be available outside this module
export {
  Action,      // actions / states
  Params,      // VM parameters; used to display / alter parameters
  Group,       // a VM group
  GlobalState, // global state, includes state of all vms & all groups

  // All these use POST and return a GlobalState, or Exception on error
  add,
  rm,
  set,
  list,
  vtimport,    // import was ES6 reserved word
  vtexport,    // export was ES6 reserved word
  link, 
  unlink,
  upload,
  rmfile,
  listfiles
};
