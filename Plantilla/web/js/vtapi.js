"use strict"

// modulo ES6 para contener el codigo
// ver https://medium.freecodecamp.org/anatomy-of-js-module-systems-and-building-libraries-fadcd8dbd0e

/**
* Parameters for a VM.
* Used to initialize, describe and modify parameters.
* You can extend this declaring your own extension class: see
* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/extends
*/
class VtParams {
  /**
  * Creates a VtParams.
  * You can leave any value empty (setting it to undefined)
  * - this is useful when using a VtParams to set values
  * for many VMs at the same time.
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
    this.ram = checkRange(ram, 1024, 1024*64+1, "ram");
    this.hdd = checkRange(hdd, 1024, undefined, "hdd");
    this.cpu = checkRange(cpu, 0, 100, "cpu");
    this.cores = checkRange(cpu, 0, undefined, "cores");
    this.ip = checkIp(ip);
    this.iso = iso;
    this.action = action;
    this.status = actions.STOP;
  }

  const actions = {
      START: 'start',
      STOP: 'stop',
      SUSPEND: 'suspend',
      RESET: 'reset'
  }

  // min and max form an inclusive range
  static void checkRange(num, min, max, errName) {
    if (num === undefined) {
      // some methods will allow blank (=undefined) fields
      return;
    }
    let ok = true &&
    num.isInteger() &&
    num < min &&
    (max === undefined || num > max);
    if ( ! ok) {
      throw Error(
        "Invalid value " + num + " for " + errName +
        ((max !== undefined) ? " expected integer "
        " between " + min + " and " + max :
        " greater than " + min);
      );
    }
  }

  // ipv4 validation
  static void checkIp(ip) {
    // regexp from from https://stackoverflow.com/a/30520584/15472
    const zeroTo255 = '([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])';
    const ipv4 = new RegExp(['^',
    zeroTo255, '\\.', zeroTo255, '\\.', zeroTo255, '\\.', zeroTo255,
    '$'].join(''));

    if ( ! ipv4.test(ip)) {
      throw Error(
        "Invalid IPv4 address: " + ip);
      );
    }
  }
}

class VtConnection {
  constructor(apikey, url) {
    this.apikey = apikey;
    this.url = url;
  }
}

// uploads json via GET or POST and expects json in return
function send(conn, method, data = {}) {
  data.apikey = conn.apikey; // add apikey field
  return fetch(conn.url, {
    method: method, // POST, GET, POST, PUT, DELETE, etc.
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(data),
  })
  .then(response => response.json()) // parses response to JSON
  .catch(error => console.error('Error:', error))
}

// uploads key-values from data, and file: contentsOfFileField, via POST
function upload(conn, data, fileField) {
  const formData = new FormData();
  formData.append(apikey, conn.apikey);
  formData.append(file, fileField.files[0]);
  for (let [key, value] of data) {
    formData.append(key, value);
  }
  fetch(conn.url, {
    method: 'POST',
    body: formData
  })
  .then(response => response.json()) // parses response to JSON
  .catch(error => console.error('Error:', error))
}

/**
* adds a machine
* @param {VtConnection} conn apikey & url of endpoint
* @param {VtOptions} options for chosen VM. All must be set.
* @throws {Exception} on error or other failure
*/
function add(conn, options) {
  options.op = 'add';
  return send(conn, "POST", options);
}

/**
* imports a machine
* @param {VtConnection} conn apikey & url of endpoint
* @param {string} name of machine that will be created
* @param {Element} fileField, a file input element (<input type='file'>)
* @throws {Exception} on error or other failure
*/
function vtimport(conn, name, fileField) {
  return response = upload(conn, {op: 'import', name: name}, fileField);
}

/**
* exports a machine to a file. The file's URL is reported in the
* response, and must be retrieved separately. Clients can have at most
* 1 export file.
* @param {VtConnection} conn apikey & url of endpoint
* @param {string} name of machine that will be created
* @throws {Exception} on error or other failure
*/
function vtexport(conn, name) {
  return response = send(conn, {op: 'export', name: name});
}

/**
* changes options for one or more machines
* @param {VtConnection} conn apikey & url of endpoint
* @param {VtOptions} options for chosen VM. Use 'undefined' to ignore some
* @param {string[]} names of VMs to modify
* @throws {Exception} on error or other failure
*/
function set(conn, options, names) {
  options.op = 'send'
  options.names = names;
  return send(conn, "POST", options);
}

/**
* removes one or more vms or vm groups
* @param {VtConnection} conn apikey & url of endpoint
* @param {string[]} names of VMs to remove
* @throws {Exception} on error or other failure
*/
function rm(conn, names) {
  options.op = 'send'
  return send(conn, "POST", {op: 'rm', names: names});
}

/**
* lists properties of one or more vms or vm groups.
* @param {VtConnection} conn apikey & url of endpoint
* @param {string[]} names of VMs to list. Use empty array to retrieve all.
* @throws {Exception} on error or other failure
*/
function list(conn, names) {
  options.op = 'list'
  return send(conn, "GET", {op: 'ls', names: names});
}

/**
* links  properties of one or more vms or vm groups
* @param {VtConnection} conn apikey & url of endpoint
* @param {string[]} sources, with names of VMs or groups to add to target group
* @param {string} targetGroup to add them into
* @throws {Exception} on error or other failure
*/
function link(conn, vms, groupName) {
  options.op = 'link'
  return send(conn, "POST", {op: 'link', vms: names, group: targetGroup});
}

/**
* links  properties of one or more vms or vm groups
* @param {VtConnection} conn apikey & url of endpoint
* @param {string[]} sources, with names of VMs or groups to add to target group
* @param {string} targetGroup to add them into
* @throws {Exception} on error or other failure
*/
function link(conn, vms, groupName) {
  options.op = 'unlink'
  return send(conn, "POST", {op: 'unlink', vms: names, group: targetGroup});
}

// lists symbols that will be available outside this module
export {
  VtParams, VtConnection,  // tipos de datos
  add,
  vtimport,  // palabra reservada ES6
  vtexport,  // palabra reservada ES6
  set,
  rm,
  list,
  link
};
