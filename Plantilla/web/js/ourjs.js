let machines = [
    {
        id: 1,
        name: "VM1",
        ram: 4,
        disc: 500,
        cpu: 50,
        cores: 2,
        ip: "192.168.1.10"
    },
    {
        id: 2,
        name: "VM2",
        ram: 4,
        disc: 500,
        cpu: 50,
        cores: 2,
        ip: "192.168.1.10"
    },
    {
        id: 3,
        name: "VM3",
        ram: 4,
        disc: 500,
        cpu: 50,
        cores: 2,
        ip: "192.168.1.10"
    },
    {
        id: 4,
        name: "VM4",
        ram: 4,
        disc: 500,
        cpu: 50,
        cores: 2,
        ip: "192.168.1.10"
    },
    {
        id: 5,
        name: "VM5",
        ram: 4,
        disc: 500,
        cpu: 50,
        cores: 2,
        ip: "192.168.1.10"
    },
    {
        id: 6,
        name: "VM11",
        ram: 4,
        disc: 500,
        cpu: 50,
        cores: 2,
        ip: "192.168.1.10"
    }
];

let groups = [
    {
        id: 1,
        name: "Grupo 1",
        vms: [ 4 ]
    },
    {
        id: 2,
        name: "Grupo 2",
        vms: [ 1, 3 ]
    },
    {
        id: 3,
        name: "Grupo 3",
        vms: [ 1, 3, 5 ]
    },
    {
        id: 4,
        name: "Grupo 4",
        vms: [ 2, 4, 5 ]
    },
    {
        id: 5,
        name: "Grupo 5",
        vms: [ 3, 5, 6 ]
    }
];

$(document).ready(function(){
    prepareMachines();
    prepareGroups();

    //Add to group modal
    $(".addToGroup").click(function () {
        renderNotAddedList(machines, groups);
    })
    

    $("#addToGroupForm").change(function(){
        showAddToGroupType();
    });
    $("#addToGroupInput").keyup(function(){
        console.log("sjsjsjsjjs")
        showAddToGroupType();
    });
});

function prepareMachines() {
    machines.forEach( v => {
        let tag = "machine" + v.id;
        $("#machines").append('<div class="card" draggable="true">        <div class="card-header" id="headingMachine' + v.id + '">          <span class="draggableIndicator">.</span>          <h5 class="mb-0"><button class="btn btn-link" type="button" data-toggle="collapse" data-target="#' + tag + '" aria-controls="' + tag + '">' + v.name + '</button><div class="actionIcons"><img src="./img/edit.png" data-toggle="tooltip" data-placement="bottom" title="Editar"><div class="dropdown"> <img src="./img/shutdown.png" class="dropdown-toggle" id="dropdownMenuButton"data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" data-toggle="tooltip"            data-placement="bottom" title="Apagar/Reiniciar/Suspender">          <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">            <button class="dropdown-item" href="#">Encender</button>            <button class="dropdown-item" href="#" disabled>Suspender</button>            <button class="dropdown-item" href="#" disabled>Reiniciar</button>            <button class="dropdown-item" href="#" disabled>Apagar</button>          </div></div><img src="./img/delete.png" data-toggle="tooltip" data-placement="bottom" title="Eliminar"></div></h5></div><div id="machine' + v.id + '" class="collapse" aria-labelledby="headingMachine' + v.id + '" data-parent="#accordionExample">        <div class="card-body">          <table>            <tr>              <th>Nombre</th>              <td>' + v.name + '</td>            </tr>            <tr>              <th>RAM</th>              <td>' + v.ram + 'GB</td>            </tr>            <tr>              <th>Disco</th>              <td>' + v.disc + 'GB</td>            </tr>            <tr>              <th>CPU</th>              <td>' + v.cpu + '%</td>            </tr>            <tr>              <th>Núcleos</th>              <td>' + v.cores + '</td>            </tr>            <tr>              <th>IP</th>              <td>'+ v.ip + '</td>            </tr>          </table>        </div>      </div>            </div>');
    });
}

function prepareGroups() {
    groups.forEach( g => {
        let group = '';
        group += '<div class="card" draggable="true">        <div class="card-header" id="headingGroup' + g.id + '">          <span class="draggableIndicator">.</span>          <h5 class="mb-0">            <button class="btn btn-link" type="button" data-toggle="collapse" data-toggle="tooltip" data-target="#group' + g.id + '"              aria-controls="group' + g.id + '">              ' + g.name + '            </button>            <div class="actionIcons">              <img src="./img/edit.png" data-toggle="tooltip" data-placement="bottom" title="Editar">              <img src="./img/addToGroup.png" class="addToGroup" data-target="#addToGroup" data-toggle="modal"                data-placement="bottom" title="Añadir">              <img src="./img/delete.png" data-toggle="tooltip" data-placement="bottom" title="Eliminar">            </div>          </h5>        </div> <div id="group' + g.id + '" class="collapse" aria-labelledby="headingGroup' + g.id + '" data-parent="#accordionExample"> <div class="card-body">';
        for (let v in g.vms) {
            let vName = getName(g.vms[v]);
            if (vName)
                group += '<div class="card">           <div class="card-header" id="headingMachine' + g.vms[v] + '">             <h5 class="mb-0">               <button class="btn btn-link" type="button" data-toggle="collapse" data-target="#machine' + g.vms[v] + '"                 aria-controls="machine' + g.vms[v] + '">                 ' + vName + '               </button>               <div class="actionIcons">                 <img src="./img/quit.png" data-toggle="tooltip" data-placement="bottom" title="Sacar del grupo">               </div>             </h5>           </div>         </div>';
        };
        group += '        </div>      </div>    </div>';
        $("#groups").append(group);
    });
}

function getName(id) {
    for(let v in machines) {
        if(machines[v].id == id)
            return machines[v].name;
    }
    return null;
}
function renderNotAddedItem(name, id, type) {
    name = name.replace(/\s/g, '');
    var item = '<div class="card '+type+'" id="'+name+'">'+
    '<div class="card-header" id="heading' + name + '">'+
      '<h5 class="mb-0">'+
        '<button class="btn btn-link" type="button" data-toggle="collapse" data-target="#'+name+'"aria-controls="'+name+'">'+
          name+
        '</button>'+
        '<div class="actionIcons">'+
          '<img src="./img/addToGroup.png" data-toggle="tooltip" data-placement="bottom" title="Añadir">'+
        '</div>'+
      '</h5>'+
    '</div>'+
  '</div>';


  return item;
}

function renderAddedItem(name, id, type) {
    name = name.replace(/\s/g, '');
    var item = '<div class="card '+type+'" id="'+id+'">'+
    '<div class="card-header" id="heading' + name + '">'+
      '<h5 class="mb-0">'+
        '<button class="btn btn-link" type="button" data-toggle="collapse" data-target="#'+name+'"aria-controls="'+name+'">'+
          name+
        '</button>'+
        '<div class="actionIcons">'+
          '<img src="./img/quit.png" data-toggle="tooltip" data-placement="bottom" title="Quitar">'+
        '</div>'+
      '</h5>'+
    '</div>'+
  '</div>';

  return item;
}
function renderNotAddedList(machines, groups) {
    var groupsHtml = "";
    groups.forEach( g => {
        groupsHtml += renderNotAddedItem(g.name, g.id, 'group');
    });
    var machinesHtml = "";
    machines.forEach( m => {
        machinesHtml += renderNotAddedItem(m.name, m.id, 'machine');
    });
    $("#addToGroupItems").append(groupsHtml);
    $("#addToGroupItems").append(machinesHtml);
    showAddToGroupType();
}
function showAddToGroupType() {
    var value = $('input[name=addToGroupRadio]:checked', '#addToGroupForm').val();
    if(value === "optionVM"){
        $(".group").hide();
        if ($("#addToGroupInput").val().length>0) {
            for (let index = 0; index < $('.machine').length; index++) {
                var mId = $('.machine')[index].id;
                if(!mId.includes($("#addToGroupInput").val())){
                    $("#"+mId).hide();
                }
                else{
                    $("#"+mId).show();
                }
                
            }
        }
        else{
            $('.machine').show();
        }
        
    }
    else{
        if ($("#addToGroupInput").val().length>0) {
            for (let index = 0; index < $('.group').length; index++) {
                var gId = $('.group')[index].id;
                if(!gId.includes($("#addToGroupInput").val())){
                    $("#"+gId).hide();
                }
                else{
                    $("#"+gId).show();
                }
                
            }
        }
        else{
            $('.group').show();
        }
        $('.machine').hide();
    }
}

