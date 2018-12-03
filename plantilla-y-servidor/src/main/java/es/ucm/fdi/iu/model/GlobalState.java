package es.ucm.fdi.iu.model;

import java.util.ArrayList;

import com.fasterxml.jackson.annotation.JsonView;

public class GlobalState {
    @JsonView(Views.Public.class)
	private ArrayList<Params> vms;
    @JsonView(Views.Public.class)
	private ArrayList<Group> groups;
	
	public GlobalState() {
	}
	
	public GlobalState(User u) {
		groups = new ArrayList<>(u.getGroups());
		vms = new ArrayList<>(u.getParams());		
	}

	public ArrayList<Params> getVms() {
		return vms;
	}

	public void setVms(ArrayList<Params> vms) {
		this.vms = vms;
	}

	public ArrayList<Group> getGroups() {
		return groups;
	}

	public void setGroups(ArrayList<Group> groups) {
		this.groups = groups;
	}
}
