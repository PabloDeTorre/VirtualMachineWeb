import * as Vt from './vtapi.js';

function handleResult(result, successFn, errorFn) {
    console.log("result: ", result)
    if (result.error) {
        // error, .message nos indicará el problema
        errorFn(result.message);
    } else {
        successFn(result);
    }
}

$(function () {
    // cambia esto a http://localhost:8000 si decides lanzar tú el servidor (vía mvn spring-boot:run)
    const apiServer = 'http://gin.fdi.ucm.es:8080/';

    // aqui guardaremos siempre el estado de la aplicacion, por ejemplo para verificar si 
    // los nombres de vms existen o no; ver update(r)
    let state = { vms: [], groups: [] };
    let maquinasAñadir = [];
    let maquinasQuitar = [];

    let url = apiServer + "314161";
    console.log(url);

    // actualiza la visualizacion
    Vt.list(url).then(r => update(r));

    $(".close").click(function () {

    });
    $("#addMachineOrGroupButton").click(function () {
        addMachineOrGroup();
    });
    $("#editMachineOrGroupButton").click(function () {
        editMachineOrGroup();
    });
    $("#addForm").change(function () {
        showAddOrGroupType();
    });
    $("#importSubmitButton").click(function () {
        if (!$("#importForm").parsley().isValid()) {
            return;
        }
        var file, fr, myFile;
        myFile = document.getElementById('fileinput');
        file = myFile.files[0];
        fr = new FileReader();
        fr.onload = function (e) {
            var newItem = JSON.parse(e.target.result);
            const sampleParams = new Vt.Params(
                $("#inputimportName").val(),
                parseInt(newItem.ram),
                parseInt(newItem.hdd),
                parseInt(newItem.cpu),
                parseInt(newItem.cores),
                newItem.ip
            );
            Vt.add(url, sampleParams).then(r => update(r));
            Vt.add(url, sampleParams).then(r => update(r));
        };
        fr.readAsText(file);
    });
    function update(result) {
        handleResult(result,
            r => {
                state = r;
                console.log("New state: ", state);
                try {
                    addIdParam();
                    state.vms = state.vms.sort(sortByName);
                    state.groups = state.groups.sort(sortByName);
                    prepareMachines(state.vms);
                    prepareGroups(state.groups);
                    addListeners();
                } catch (e) {
                    console.log(e);
                }
            },
            m => console.log("BUAAAAA - ", m))
    }
    function addListeners() {
        $(".editButton").click(function (e) {
            openEditModal(e);
        });
        $(".power-button").click(function (e) {
            setState(e.currentTarget.id, e.currentTarget.lastChild.data);
            if (e.currentTarget.lastChild.data === "Reiniciar") {
                setTimeout(() => {
                    setState(e.currentTarget.id, "start");
                }, 1200);
            }

        });
        $(".deleteButton").click(function (e) {
            removeItem(e.currentTarget.id);
        });
        $(".addToGroupButton").click(function (e) {
            openAddToGroupModal(e.currentTarget.id);
        });
        $(".quitMVButton").click(function (e) {
            var groupName = getItem(e.currentTarget.classList[1]).name;
            Vt.unlink(url, [getItem(e.currentTarget.id).name], groupName).then(r => update(r));
        });
        $(".itemGroup").on("drop", function (e) {
            this.style.border = "0";
            e.preventDefault();
            if ($("#dragAndDropId").val() != this.id) {
                var item = getItem(this.id);
                if (item.elements.indexOf(getItem($("#dragAndDropId").val()).name) < 0) {
                    Vt.link(url, [getItem($("#dragAndDropId").val()).name], item.name).then(r => {
                        update(r);
                        console.log("Elemento añadido");
                    });
                } else {
                    console.log("Este elemento ya existe en el grupo");
                }
            }
        });
        $(".itemGroup").on("dragover", function (e) {
            e.preventDefault();
            this.style.border = "2px dashed black";
        });
        $(".itemGroup").on("dragleave", function (e) {
            e.preventDefault();
            this.style.border = "0";
        });
        $(".item").on("dragstart", function (e) {
            this.style.opacity = '0.4';
            $("#dragAndDropId").val(this.id);
        })
        $(".item").on("dragend", function (e) {
            this.style.opacity = '1';
        })
        $(".export").click(function () {
            prepareExport();
        })
        $("#exportButton").click(function () {
            var name = $("#exportName").val();
            download(name + ".json", JSON.stringify(getItemByName(name)));
            Vt.vtexport(url, name).then(r => update(r));

        })
    }

    function prepareExport() {
        var names = "";
        var machines = state.vms;
        for (let v in machines) {
            names += "<option value='" + machines[v].name + "'>" + machines[v].name + "</option>";
        }
        var groups = state.groups;
        for (let g in groups) {
            names += "<option value='" + groups[g].name + "'>" + groups[g].name + "</option>";
        }
        $("#exportName").append(names);
    }
    function download(filename, text) {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:json;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }
    function prepareMachines(machines) {
        $("#machines").html("");
        machines.forEach(v => {
            let tag = "machine" + v.id;
            $("#machines").append('\
        <div class="card item" draggable="true" id="' + v.id + '">\
            <div class="card-header" id="headingMachine' + v.id + '">\
                <span class="draggableIndicator">.</span>\
                <h5 class="mb-0"><button class="btn btn-link" type="button" data-toggle="collapse" data-target="#' + tag + '" aria-controls="' + tag + '">' + v.name + '</button>\
                    <span class="mvState">'+ parseVMState(v.id) + '</span>\
                    <div class="actionIcons">\
                        <img src="./img/edit.png" id="'+ v.id + '" class="editButton" data-toggle="modal" data-toggle="tooltip" data-target="#editPopUp" data-toggle="tooltip" data-placement="bottom" title="Editar">\
                        <div class="dropdown">\
                            <img src="./img/shutdown.png" class="dropdown-toggle" id="dropdownMenuButton"data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" data-toggle="tooltip"\
                                data-placement="bottom" title="Apagar/Reiniciar/Suspender">\
                            <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">\
                                <button id="'+ v.id + '" class="dropdown-item power-button"  href="#"' + buttonDisabled(v.id, "start") + '>Encender</button>\
                                <button id="'+ v.id + '" class="dropdown-item power-button" href="#" ' + buttonDisabled(v.id, "suspend") + '>Suspender</button>\
                                <button id="'+ v.id + '" class="dropdown-item power-button" href="#" ' + buttonDisabled(v.id, "restart") + '>Reiniciar</button>\
                                <button id="'+ v.id + '" class="dropdown-item power-button" href="#" ' + buttonDisabled(v.id, "stop") + '>Apagar</button>\
                            </div>\
                        </div>\
                        <img src="./img/delete.png" class="deleteButton" id="'+ v.id + '" data-toggle="tooltip" data-placement="bottom" title="Eliminar">\
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
                            <td>' + v.hdd + 'GB</td>\
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

    function prepareGroups(groups) {
        $("#groups").html("");
        groups.forEach(g => {
            let group = '';
            group += '<div class="card item itemGroup" draggable="true" id="' + g.id + '">' +
                '<div class="card-header" id="headingGroup' + g.id + '">' +
                '<span class="draggableIndicator">.</span>' +
                '<h5 class="mb-0">' +
                '<button class="btn btn-link" type="button" data-toggle="collapse" data-toggle="tooltip" data-target="#group' + g.id + '" aria-controls="group' + g.id + '">' +
                g.name +
                '</button>' +
                '<div class="actionIcons">' +
                '<img src="./img/addToGroup.png" id="' + g.id + '" class="addToGroupButton" data-target="#addToGroup" data-toggle="modal" data-placement="bottom" title="Añadir">' +
                '<img src="./img/delete.png" class="deleteButton" id="' + g.id + '" data-toggle="tooltip" data-placement="bottom" title="Eliminar">' +
                '</div>' +
                '</h5>' +
                '</div>' +
                '<div id="group' + g.id + '" class="collapse" aria-labelledby="headingGroup' + g.id + '" data-parent="#accordionExample">' +
                '<div class="card-body">';
            for (let v in g.elements) {
                let vName = getItemByName(g.elements[v]);
                if (vName)
                    group += '<div class="card">' +
                        '<div class="card-header" id="headingMachine' + vName.id + '">' +
                        '<h5 class="mb-0">' +
                        '<button class="btn btn-link" type="button" data-toggle="collapse" data-target="#machine' + vName.id + '" aria-controls="machine' + vName.id + '">' +
                        vName.name +
                        '</button>' +
                        '<div class="actionIcons">' +
                        '<img src="./img/quit.png" id="' + vName.id + '" class="quitMVButton ' + g.id + '" data-toggle="tooltip" data-placement="bottom" title="Sacar del grupo">' +
                        '</div>' +
                        '</h5>' +
                        '</div></div>';
            };
            group += '        </div>      </div>    </div>';
            $("#groups").append(group);
        });
    }




    function getName(id) {
        for (let v in machines) {
            if (machines[v].id == id)
                return machines[v].name;
        }
        for (let g in groups) {
            if (groups[g].id == id)
                return groups[g].name;
        }
        return null;
    }
    function getItem(id) {
        var machines = state.vms;
        for (let v in machines) {
            if (machines[v].id == id)
                return machines[v];
        }
        var groups = state.groups;
        for (let g in groups) {
            if (groups[g].id == id)
                return groups[g];
        }
        return null;
    }
    function getItemByName(name) {
        var machines = state.vms;
        for (let v in machines) {
            if (machines[v].name == name)
                return machines[v];
        }
        var groups = state.groups;
        for (let g in groups) {
            if (groups[g].name == name)
                return groups[g];
        }
        return null;
    }
    function openAddToGroupModal(groupId) {
        var item = getItem(groupId);
        $("#groupId").val(groupId);

        $('#addToGroupTitle').html("Añadir a " + item.name);
        $("#addToGroupItems").html('');
        renderNotAddedList(state.vms, state.groups);

        fillAddedItems(getItem(groupId));

        $("#addToGroupForm").change(function () {
            showAddToGroupType();
        });
        $("#addToGroupInput").keyup(function () {
            showAddToGroupType();
        });
        $('#addToGroupSubmit').click(function () {
            var item = getItem(groupId);
            console.log(item, maquinasQuitar, maquinasAñadir);
            Vt.link(url, maquinasAñadir, item.name).then(r => update(r));
            if (maquinasQuitar.length > 0) {
                Vt.unlink(url, maquinasQuitar, item.name).then(r => update(r));
            }



            maquinasAñadir = [];
            maquinasQuitar = [];


        });
        $(".addItemToGroup").click(function (e) {
            addItemToGroup(e.currentTarget.id);
        });
        $(".delItemToGroup").click(function (e) {
            delItemToGroup(e.currentTarget.id);
        });

    }
    function renderNotAddedItem(i, type) {
        var item = '<div class="card ' + type + '" id="addTogroup' + i.id + '">' +
            '<div class="card-header" id="heading' + i.id + '">' +
            '<h5 class="mb-0">' +
            '<button class="btn btn-link" type="button" ' + i.id + '"aria-controls="' + i.id + '">' +
            i.name +
            '</button>' +
            '<div class="actionIcons">' +
            '<img src="./img/addToGroup.png" id="' + i.id + '" class="addItemToGroup" data-toggle="tooltip" data-placement="bottom" title="Añadir"' +
            '</div>' +
            '</h5>' +
            '</div>' +
            '</div>';


        return item;
    }

    function renderAddedItem(i) {
        var item = '<div class="card" id="addedTogroup' + i.id + '">' +
            '<div class="card-header" id="heading' + i.id + '">' +
            '<h5 class="mb-0">' +
            '<button class="btn btn-link" type="button" ' + i.id + '"aria-controls="' + i.id + '">' +
            i.name +
            '</button>' +
            '<div class="actionIcons">' +
            '<img src="./img/quit.png" id="' + i.id + '" class="delItemToGroup" data-toggle="tooltip" data-placement="bottom" title="Quitar"' +
            '</div>' +
            '</h5>' +
            '</div>' +
            '</div>';

        return item;
    }
    function renderNotAddedList(machines, groups) {
        var groupsHtml = "";
        groups.forEach(g => {
            groupsHtml += renderNotAddedItem(g, 'group');
        });
        var machinesHtml = "";
        machines.forEach(m => {
            machinesHtml += renderNotAddedItem(m, 'machine');
        });
        $("#addToGroupItems").append(groupsHtml);
        $("#addToGroupItems").append(machinesHtml);

        showAddToGroupType();
    }
    function showAddToGroupType() {
        var value = $('input[name=addToGroupRadio]:checked', '#addToGroupForm').val();
        var actualGroup = getItem($('#groupId').val());
        if (value === "optionVM") {
            $(".group").hide();
            for (let index = 0; index < $('.machine').length; index++) {
                var mId = $('.machine')[index].id.slice(10);
                var mName = getItem(mId).name;
                if (($("#addToGroupInput").val().length > 0 && !mId.includes($("#addToGroupInput").val())) || actualGroup.elements.indexOf(mName) > -1) {
                    $("#addTogroup" + mId).hide();
                }
                else {
                    $("#addTogroup" + mId).show();
                }
            }


        }
        else {
            $('.machine').hide();
            for (let index = 0; index < $('.group').length; index++) {
                var gId = $('.group')[index].id.slice(10);
                var gName = getItem(gId).name;
                if (gId === actualGroup.id || ($("#addToGroupInput").val().length > 0 && !gId.includes($("#addToGroupInput").val())) || actualGroup.elements.indexOf(gName) > -1) {
                    $("#addTogroup" + gId).hide();
                }
                else {
                    $("#addTogroup" + gId).show();
                }
            }
        }

    }
    function fillAddedItems(g) {
        //Clear items
        $("#addedToGroupItems").html('');

        var addedMvs = "";
        if (g.elements.length > 0) {
            g.elements.forEach(vm => {
                addedMvs += renderAddedItem(getItemByName(vm));

                var vmid = "#addTogroup" + getItemByName(vm).id;
                //$(vmid).hide();
            });
        }
        $("#addedToGroupItems").append(addedMvs);
        $(".delItemToGroup").click(function (e) {
            delItemToGroup(e.currentTarget.id);
        });
        showAddToGroupType();


    }
    function addItemToGroup(machineId) {
        var idFather = $('#groupId').val();
        var g = getItem(idFather);
        if (g.elements.indexOf(getItem(machineId).name) < 0) {
            g.elements.push(getItem(machineId).name);
            maquinasAñadir.push(getItem(machineId).name);

        } else {
            maquinasAñadir.splice(maquinasAñadir.indexOf(getItem(machineId).name), 1);
        }
        fillAddedItems(g);
    }
    function delItemToGroup(machineId) {
        var idFather = $('#groupId').val();
        var g = getItem(idFather);
        if (g.elements.indexOf(getItem(machineId).name) > -1) {
            g.elements.splice(g.elements.indexOf(getItem(machineId).name), 1);
            maquinasQuitar.push(getItem(machineId).name);
        }
        fillAddedItems(g);
    }
    function deleteRepeated(array) {
        var uniqueNames = [];
        $.each(array, function (i, el) {
            if ($.inArray(el, uniqueNames) === -1) uniqueNames.push(el);
        });
        return uniqueNames;
    }
    function addMachineOrGroup() {
        var value = $('input[name=addRadio]:checked', '#addForm').val();
        if (!$("#addForm").parsley().isValid()) {
            return;
        }
        if (value == "optionVM") {

            const sampleParams = new Vt.Params(
                $("#addMachineGroupName").val(),
                parseInt($("#addMachineGroupRam").val()),
                parseInt($("#addMachineGroupHdd").val()),
                parseInt($("#addMachineGroupCPU").val()),
                parseInt($("#addMachineGroupCores").val()),
                $("#addMachineGroupIp").val()
            );

            Vt.add(url, sampleParams).then(r => update(r));
        }
        else {
            const name = $("#addMachineGroupName").val();
            Vt.link(url, [], name).then(r => update(r));
        }
        $("#addForm").parsley().reset();
    }
    function addIdParam() {
        for (let v in state.vms) {
            if (!state.vms[v].id)
                state.vms[v].id = state.vms[v].name.replace(/\s+/g, '');
        }
        for (let g in state.groups) {
            if (!state.groups[g].id)
                state.groups[g].id = state.groups[g].name.replace(/\s+/g, '');
        }
    }
    function showAddOrGroupType() {
        var value = $('input[name=addRadio]:checked', '#addForm').val();
        if (value == "optionVM") {
            $("#addPopUpTitle").html("Nueva máquina");
            $("#addMachineGroupRam").parent().parent().show();
            $("#addMachineGroupHdd").parent().parent().show();
            $("#addMachineGroupCPU").parent().parent().show();
            $("#addMachineGroupCores").parent().parent().show();
            $("#addMachineGroupIp").parent().parent().show();
            $("#customFile").parent().parent().show();

            $("#addMachineGroupRam").attr("required", true);
            $("#addMachineGroupHdd").attr("required", true);
            $("#addMachineGroupCPU").attr("required", true);
            $("#addMachineGroupCores").attr("required", true);
            $("#addMachineGroupIp").attr("required", true);
        }
        else {
            $("#addPopUpTitle").html("Nuevo grupo");
            $("#addMachineGroupRam").parent().parent().hide();
            $("#addMachineGroupHdd").parent().parent().hide();
            $("#addMachineGroupCPU").parent().parent().hide();
            $("#addMachineGroupCores").parent().parent().hide();
            $("#addMachineGroupIp").parent().parent().hide();
            $("#customFile").parent().parent().hide();

            $("#addMachineGroupRam").attr("required", false);
            $("#addMachineGroupHdd").attr("required", false);
            $("#addMachineGroupCPU").attr("required", false);
            $("#addMachineGroupCores").attr("required", false);
            $("#addMachineGroupIp").attr("required", false);
        }
    }
    function openEditModal(e) {
        var item = getItem(e.currentTarget.id);
        $("#editMachineGroupName").val(item.name);

        $('#inlineVM').attr("checked", true);
        showAddOrGroupType();

        $("#editMachineGroupRam").val(item.ram);
        $("#editMachineGroupHdd").val(item.hdd);
        $("#editMachineGroupCPU").val(item.cpu);
        $("#editMachineGroupCores").val(item.cores);
        $("#editMachineGroupIp").val(item.ip);

    }
    function editMachineOrGroup() {
        if (!$("#editForm").parsley().isValid()) {
            return;
        }
        const params = new Vt.Params(
            $("#editMachineGroupName").val(),
            parseInt($("#editMachineGroupRam").val()),
            parseInt($("#editMachineGroupHdd").val()),
            parseInt($("#editMachineGroupCPU").val()),
            parseInt($("#editMachineGroupCores").val()),
            $("#editMachineGroupIp").val(),
            undefined
        );
        Vt.set(url, params, [$("#editMachineGroupName").val()]).then(r => update(r));
        $("#editForm").parsley().reset();
    }
    function parseVMState(id) {
        var item = getItem(id);
        switch (item.state) {
            case "start":
                return "Corriendo...";
                break;
            case "stop":
                return "";
                break;
            case "suspend":
                return "Suspendida...";
                break;
            case "restart":
                return "Reniniciando...";
                break;
            default:
                break;
        }
    }
    function setState(id, state) {
        var item = getItem(id);
        switch (state) {
            case "Encender":
                state = "start";
                break;
            case "Suspender":
                state = "suspend";
                break;
            case "Reiniciar":
                state = "restart";
                break;
            case "Apagar":
                state = "stop";
                break;

            default:
                break;
        }
        const params = new Vt.Params(
            item.name,
            item.ram,
            item.hdd,
            item.cpu,
            item.cores,
            item.ip,
            undefined,
            state
        );
        Vt.set(url, params, [item.name]).then(r => update(r));

    }
    function buttonDisabled(id, buttonState) {
        var item = getItem(id);
        switch (item.state) {
            case "start":
                if (buttonState == "start") {
                    return "disabled";
                }
                break;
            case "stop":
                if (buttonState == "stop" || buttonState == "suspend" || buttonState == "restart") {
                    return "disabled";
                }
                break;
            case "suspend":
                if (buttonState == "suspend") {
                    return "disabled";
                }
                break;
            case "restart":
                if (buttonState == "stop" || buttonState == "suspend" || buttonState == "restart" || buttonState == "start") {
                    return "disabled";
                }
                break;
            default:
                break;
        }
        return "";
    }
    function sortByName(x, y) {
        return x.name > y.name;
    }
    function removeItem(id) {
        Vt.rm(url, [getItem(id).name]).then(r => update(r));
    }

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

    $("#addForm").parsley(parsleyForBootstrap4);
    $("#editForm").parsley(parsleyForBootstrap4);
    $("#importForm").parsley(parsleyForBootstrap4);

    // define un validador llamado newname, que se activa usando
    // un atributo data-parsley-newname="" en el campo a validar
    window.Parsley.addValidator('name', {
        validateString: function (value) {
            let names = new Set();
            state.vms.forEach(vm => names.add(vm.name))
            state.groups.forEach(group => names.add(group.name))
            return !names.has(value);
        },
        messages: {
            en: 'Chosen name already exists. Find another',
            es: "Ese nombre ya existe. Elige otro"
        }
    });
    window.Parsley.addValidator('ip', {
        validateString: function (value) {
            // from https://stackoverflow.com/questions/10006459/regular-expression-for-ip-address-validation?lq=1
            return /^(?=\d+\.\d+\.\d+\.\d+$)(?:(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]|[0-9])\.?){4}$/.test(value);
        },
        messages: {
            en: 'Invalid IP, try another',
            es: "IP no válida, prueba otra"
        }
    });
});