let machines = [
    {
        id: "VM1",
        name: "VM1",
        ram: 4,
        disc: 500,
        cpu: 50,
        cores: 2,
        ip: "192.168.1.10"
    },
    {
        id: "VM2",
        name: "VM2",
        ram: 4,
        disc: 500,
        cpu: 50,
        cores: 2,
        ip: "192.168.1.10"
    },
    {
        id: "VM3",
        name: "VM3",
        ram: 4,
        disc: 500,
        cpu: 50,
        cores: 2,
        ip: "192.168.1.10"
    },
    {
        id: "VM4",
        name: "VM4",
        ram: 4,
        disc: 500,
        cpu: 50,
        cores: 2,
        ip: "192.168.1.10"
    },
    {
        id: "VM5",
        name: "VM5",
        ram: 4,
        disc: 500,
        cpu: 50,
        cores: 2,
        ip: "192.168.1.10"
    },
    {
        id: "VM11",
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
        id: "Grupo1",
        name: "Grupo 1",
        vms: [ "VM4" ]
    },
    {
        id: "Grupo2",
        name: "Grupo 2",
        vms: [ "VM1", "VM3","Grupo1" ]
    },
    {
        id: "Grupo3",
        name: "Grupo 3",
        vms: [ "VM1", "VM3", "VM5" ]
    },
    {
        id: "Grupo4",
        name: "Grupo 4",
        vms: [ "VM2", "VM4", "VM5" ]
    },
    {
        id: "Grupo5",
        name: "Grupo 5",
        vms: [ "VM3", "VM5", "VM6" ]
    }
];

$(document).ready(function(){
    prepareMachines();
    prepareGroups();
    $(".close").click(function() {
        prepareMachines();
        prepareGroups();
    })
});

function prepareMachines() {
    $("#machines").html("");
    machines.forEach( v => {
        let tag = "machine" + v.id;
        $("#machines").append('\
        <div class="card" draggable="true">\
            <div class="card-header" id="headingMachine' + v.id + '">\
                <span class="draggableIndicator">.</span>\
                <h5 class="mb-0"><button class="btn btn-link" type="button" data-toggle="collapse" data-target="#' + tag + '" aria-controls="' + tag + '">' + v.name + '</button>\
                    <div class="actionIcons">\
                        <img src="./img/edit.png" data-toggle="tooltip" data-placement="bottom" title="Editar">\
                        <div class="dropdown">\
                            <img src="./img/shutdown.png" class="dropdown-toggle" id="dropdownMenuButton"data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" data-toggle="tooltip"\
                                data-placement="bottom" title="Apagar/Reiniciar/Suspender">\
                            <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">\
                                <button class="dropdown-item" href="#">Encender</button>\
                                <button class="dropdown-item" href="#" disabled>Suspender</button>\
                                <button class="dropdown-item" href="#" disabled>Reiniciar</button>\
                                <button class="dropdown-item" href="#" disabled>Apagar</button>\
                            </div>\
                        </div>\
                        <img src="./img/delete.png" data-toggle="tooltip" data-placement="bottom" title="Eliminar">\
                    </div>\
                </h5>\
            </div>\
            <div id="machine' + v.id + '" class="collapse" aria-labelledby="headingMachine' + v.id + '" data-parent="#accordionExample">\
                <div class="card-body">\
                    <table>\
                        <tr>\
                            <th>Nombre</th>\
                            <td>' + v.name + '</td>\
                        </tr>\
                        <tr>\
                            <th>RAM</th>\
                            <td>' + v.ram + 'GB</td>\
                        </tr>\
                        <tr>\
                            <th>Disco</th>\
                            <td>' + v.disc + 'GB</td>\
                        </tr>\
                        <tr>\
                            <th>CPU</th>\
                            <td>' + v.cpu + '%</td>\
                        </tr>\
                        <tr>\
                            <th>Núcleos</th>\
                            <td>' + v.cores + '</td>\
                        </tr>\
                        <tr>\
                            <th>IP</th>\
                            <td>'+ v.ip + '</td>\
                        </tr>\
                    </table>\
                </div>\
            </div>\
        </div>');
    });
}

function prepareGroups() {
    $("#groups").html("");
    groups.forEach( g => {
        let group = '';
        group += '<div class="card" draggable="true">'+
        '<div class="card-header" id="headingGroup' + g.id + '">'+
            '<span class="draggableIndicator">.</span>'+
            '<h5 class="mb-0">'+
                '<button class="btn btn-link" type="button" data-toggle="collapse" data-toggle="tooltip" data-target="#group' + g.id + '" aria-controls="group' + g.id + '">'+
                    g.name+ 
                '</button>'+
                '<div class="actionIcons">'+
                    '<img src="./img/edit.png" data-toggle="tooltip" data-placement="bottom" title="Editar">'+
                    '<img src="./img/addToGroup.png" class="addToGroup" data-target="#addToGroup" data-toggle="modal" data-placement="bottom" title="Añadir" onclick=openAddToGroupModal("'+g.id+'")>'+
                    '<img src="./img/delete.png" data-toggle="tooltip" data-placement="bottom" title="Eliminar">'+
                '</div>'+
            '</h5>'+
        '</div>'+
        '<div id="group' + g.id + '" class="collapse" aria-labelledby="headingGroup' + g.id + '" data-parent="#accordionExample">'+
        '<div class="card-body">';
        for (let v in g.vms) {
            let vName = getName(g.vms[v]);
            if (vName)
                group += '<div class="card">'+
                '<div class="card-header" id="headingMachine' + g.vms[v] + '">'+
                    '<h5 class="mb-0">'+
                        '<button class="btn btn-link" type="button" data-toggle="collapse" data-target="#machine' + g.vms[v] + '" aria-controls="machine' + g.vms[v] + '">'+
                            vName +
                        '</button>'+
                        '<div class="actionIcons">'+
                            '<img src="./img/quit.png" data-toggle="tooltip" data-placement="bottom" title="Sacar del grupo">'+
                        '</div>'+
                    '</h5>'+
                    '</div></div>';
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
    for(let g in groups) {
        if(groups[g].id == id)
            return groups[g].name;
    }
    return null;
}
function getItem(id) {
    for(let v in machines) {
        if(machines[v].id == id)
            return machines[v];
    }
    for(let g in groups) {
        if(groups[g].id == id)
            return groups[g];
    }
    return null;
}
function openAddToGroupModal(groupId){
    $("#groupId").val(groupId);
    console.log('valeu',$('#groupId').val());

    $('#addToGroupTitle').html("Añadir a " + getName(groupId));
    $("#addToGroupItems").html('');
    renderNotAddedList(machines, groups);
    
    fillAddedItems(groups);

    $("#addToGroupForm").change(function(){
        showAddToGroupType();
    });
    $("#addToGroupInput").keyup(function(){
        showAddToGroupType();
    });
    $('#addToGroupSubmit').click(function() {
        prepareMachines();
        prepareGroups();
    });
}
function renderNotAddedItem(id, type) {
    var item = '<div class="card '+type+'" id="'+id+'">'+
    '<div class="card-header" id="heading' + id + '">'+
      '<h5 class="mb-0">'+
        '<button class="btn btn-link" type="button" data-toggle="collapse" data-target="#'+id+'"aria-controls="'+id+'">'+
          getName(id)+
        '</button>'+
        '<div class="actionIcons">'+
          '<img src="./img/addToGroup.png" data-toggle="tooltip" data-placement="bottom" title="Añadir" onclick=addItemToGroup("'+id+'")>'+
        '</div>'+
      '</h5>'+
    '</div>'+
  '</div>';


  return item;
}

function renderAddedItem(id) {
    var item = '<div class="card" id="'+id+'">'+
    '<div class="card-header" id="heading' + id + '">'+
      '<h5 class="mb-0">'+
        '<button class="btn btn-link" type="button" data-toggle="collapse" data-target="#'+id+'"aria-controls="'+id+'">'+
          getName(id)+
        '</button>'+
        '<div class="actionIcons">'+
          '<img src="./img/quit.png" data-toggle="tooltip" data-placement="bottom" title="Quitar" onclick=delItemToGroup("'+id+'")>'+
        '</div>'+
      '</h5>'+
    '</div>'+
  '</div>';

  return item;
}
function renderNotAddedList(machines, groups) {
    var groupsHtml = "";
    groups.forEach( g => {
        groupsHtml += renderNotAddedItem(g.id, 'group');
    });
    var machinesHtml = "";
    machines.forEach( m => {
        machinesHtml += renderNotAddedItem(m.id, 'machine');
    });
    $("#addToGroupItems").append(groupsHtml);
    $("#addToGroupItems").append(machinesHtml);

    showAddToGroupType();
}
function showAddToGroupType() {
    var value = $('input[name=addToGroupRadio]:checked', '#addToGroupForm').val();
    
    var actualGroup = getItem($('#groupId').val());
    if(value === "optionVM"){
        $(".group").hide();
            for (let index = 0; index < $('.machine').length; index++) {
                var mId = getName($('.machine')[index].id);
                if(($("#addToGroupInput").val().length>0 && !mId.includes($("#addToGroupInput").val())) || actualGroup.vms.indexOf(mId)> -1){
                    $("#"+mId).hide();
                }
                else{
                    $("#"+mId).show();
                }
            }
        
        
    }
    else{
        $('.machine').hide();
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
    }
}
function fillAddedItems(groups) {
    //Clear items
    $("#addedToGroupItems").html('');

    var id = $('#groupId').val();
    console.log(id);
    var addedMvs = "";
    groups.forEach(g =>{
        if(g.id === id){
            console.log(g.vms);
            g.vms.forEach(vm =>{
                addedMvs+=renderAddedItem(vm);
                
                var vmname = "#"+vm;
                $(vmname).hide();
            });
        }
    });
    $("#addedToGroupItems").append(addedMvs);

}
function addItemToGroup(machineId) {
    var idFather = $('#groupId').val();
    console.log(machineId);
    groups.forEach(g =>{
        var auxName = g.name.replace(/\s/g, '');
        if(g.id === idFather){
            g.vms.push(machineId);
        }
    });
    fillAddedItems(groups);
}
function delItemToGroup(machineId) {
    var idFather = $('#groupId').val();
    console.log(machineId);
    groups.forEach(g =>{
        var auxName = g.name.replace(/\s/g, '');
        if(g.id === idFather && g.vms.indexOf(machineId) > -1){
            g.vms.splice(g.vms.indexOf(machineId),1);
        }
    });
    fillAddedItems(groups);
    showAddToGroupType();
}

