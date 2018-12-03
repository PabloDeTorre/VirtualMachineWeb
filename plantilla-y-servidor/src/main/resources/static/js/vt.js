import * as Vt from './vtapi.js'

//
//
// Funciones reutilizables, que NO van asociadas a la interfaz.
//
//

/**
 * Actualiza la interfaz con el resultado de un envio
 * @param {Object} result recibido del servidor, construido a partir de JSON
 * @param {Function} successFn a llamar si no ha habido error
 * @param {Function} errorFn a llamar si el resultado describe un error
 */
function handleResult(result, successFn, errorFn) {
	console.log("result: ", result)
	if (result.error) {
		// error, .message nos indicará el problema
		errorFn(result.message);
  } else {
    successFn(result);
  }  
}

/**
 * Genera un entero aleatorio entre min y max, ambos inclusive
 * @param {Number} min 
 * @param {Number} max 
 */
function randomInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Envía todo un estado al servidor, como una secuencia de 'add' y 'link'
 * @param {Object} state 
 * @param {String} url 
 */
function sendJson(state, url) {
  function sequence(tasks, fn) {
    return tasks.reduce((promise, task) => promise.then(() => fn(task)), Promise.resolve());
  }
  sequence(state.vms, 
    // crea todas las VMs
    vm => Vt.add(url, vm).then(r => update(r))).then(
      () => sequence(state.groups, 
        // esto asume que no aparecen members antes de haberlos creado
        gr => Vt.link(url, gr.members, gr.name).then(r => update(r))));
}

function createGroupItem(group) {
  const html = [
    '<li id="grp_',
    group.name,
    '" ',
    'class="list-group-item d-flex justify-content-between align-items-center">',
    group.name,
    '<span class="badge badge-primary badge-pill" title="',
    group.elements.join(' '),
    '">',
    group.elements.length,
    '</span>',
    '</li>'
  ];
  return $(html.join(''));
}

function createVmItem(params) {
  const stateToBadge = {
    start: 'success',
    stop: 'danger',
    suspend: 'secondary',
    reset: 'warning'
  }
  const html = [
    '<li id="vm_',
    params.name,
    '" ',
    'class="list-group-item d-flex justify-content-between align-items-center">',
    params.name,
    '<span class="badge badge-',
    stateToBadge[params.state],
    ' badge-pill estado">&nbsp;</span>',
    '</li>'
  ];
  return $(html.join(''));
}

//
//
// Código de pegamento, ejecutado sólo una vez que la interfaz esté cargada.
// Generalmente de la forma $("selector").comportamiento(...)
//
//
$(function() { 
  console.log("online!");

  // activamos tooltips
  $('[data-toggle="tooltip"]').tooltip()
  
  // cambia esto a http://localhost:8000 si decides lanzar tú el servidor (vía mvn spring-boot:run)
  const apiServer = 'http://gin.fdi.ucm.es:8080/';
 
  // aqui guardaremos siempre el estado de la aplicacion, por ejemplo para verificar si 
  // los nombres de vms existen o no; ver update()
  let state = { vms: [], groups: [] };

  // genera un apiKey aleartorio nada más empezar
  $('#apikey_input').val(randomInRange(1000000, 200000));
  let url = apiServer + $('#apikey_input').val();
  
  // genera otro apikey aleatorio cuando se pulsa ese botón
  $("#apikey_button").click(e => {
    url = apiServer + $('#apikey_input').val();
    // actualiza la visualizacion
    Vt.list(url).then(r => update(r))    
    return false; // <-- evita que se recargue la pagina, tratandose de un formulario
  })

  /**
   * Usado para mostrar resultados de las operaciones. En tu código, deberá actualizar
   * toda la interfaz.
   * @param {Object} result 
   */
  function update(result) {
    handleResult(result, 
      r => {
        state = r; 
        console.log("New state: ", state); 
        try {
          $("#grupos").empty();
          state.groups.forEach(group =>  $("#grupos").append(createGroupItem(group)));
          $("#maquinas").empty();
          state.vms.forEach(vm =>  $("#maquinas").append(createVmItem(vm)));
        } catch (e) {
          console.log(e);
        }
      },
      m => console.log("BUAAAAA - ", m))
  }

  // añade una VM al sistema
  $("#addvm_button").click(e => {     
    if ( ! $("#addForm").parsley().isValid()) {
      return;
    }
	  const name = $("#addName").val();
    const sampleParams = new Vt.Params(
      name,
      1024*16, 1024*1024*16, 100, 2,
      '172.26.0.1'
    );
    Vt.add(url, sampleParams).then(r => update(r))
    $("#addForm").parsley().reset();
    return false; // <-- evita que se envie el formulario y recargue la pagina
  });

  // añade un grupo al sistema
  $("#addgroup_button").click(e => {     
    if ( ! $("#addForm").parsley().isValid()) {
      return;
    }
	  const name = $("#addName").val();
    Vt.link(url, [], name).then(r => update(r))
    $("#addForm").parsley().reset();
    return false; // <-- evita que se envie el formulario y recargue la pagina
  });
  
  // elimina una VM del sistema
  $("#rmForm").submit(e => {
	  const value = $("#rmName").val();
    Vt.rm(url, [value]).then(r => update(r));
    $("#rmForm").parsley().reset();
    return false; // <-- evita que se envie el formulario y recargue la pagina
  });
  
  $(".ordenable").sortable({
    connectWith: ".ordenable",
    receive: function(event, ui) {
      let src = $(ui.item).attr("id")
      let parent = $(ui.item).parent();
      let pos = $(parent).children().map(x => x.attr("id")).find(src);
      let tgt = $(parent).children().pos();
      console.log(ui, src, tgt);

      if (src.indexOf("vm_") == 0 &&
          tgt.indexOf("grp_") == 0) {
          srcName = src.substring("vm_".length);
          tgtName = tgt.substring("tgt".length);

          // y ahora faltaria mover el uno al otro, usando Link
      }
    }
  }).disableSelection();

  //
  // --- Validación de formularios ---
  //
  const parsleyForBootstrap4 = {
    errorClass: 'is-invalid text-danger',
    successClass: 'is-valid',
    errorsWrapper: '<span class="form-text text-danger"></span>',
    errorTemplate: '<span></span>',
    trigger: 'change'
  }
  
  // activa validacion del formulario con id exampleForm
  $("#exampleForm").parsley(parsleyForBootstrap4);
  $("#addForm").parsley(parsleyForBootstrap4);
  $("#rmForm").parsley(parsleyForBootstrap4);

  // define un validador llamado palindrome, que se activa usando
  // un atributo data-parsley-palindrome="" en el campo a validar
  window.Parsley.addValidator('palindrome', {
    validateString: function(value) {
      return value.split('').reverse().join('') === value;
    },
    messages: {
      en: 'This string is not the reverse of itself',
      es: "Eso no es un palíndromo, listillo"
    }
  });

  // define un validador llamado newname, que se activa usando
  // un atributo data-parsley-newname="" en el campo a validar
  window.Parsley.addValidator('newname', {
    validateString: function(value) {
      let names = new Set();
      state.vms.forEach(vm => names.add(vm.name))
      state.groups.forEach(group => names.add(group.name))
      return ! names.has(value);
    },
    messages: {
      en: 'Chosen name already exists. Find another',
      es: "Ese nombre ya existe. Elige otro"
    }
  });

  // define un validador llamado oldname, que se activa usando
  // un atributo data-parsley-oldname="" en el campo a validar
  window.Parsley.addValidator('oldname', {
    validateString: function(value) {
      let names = new Set();
      state.vms.forEach(vm => names.add(vm.name))
      state.groups.forEach(group => names.add(group.name))
      return names.has(value);
    },
    messages: {
      en: 'Chosen name does not exist. Use a valid VM or group name',
      es: "Ese nombre no existe, y no puedes borrar la VM o grupo correspondiente"
    }
  });
});
