package org.rpi.rpinfo;

/**
 * A struct to hold information about a particular person
 */
public class QueryResultModel {
	public String uid;
	public String name;
	public String email;
	public String year;
	public String department;
	
	public QueryResultModel(String uid, String name, String email, String year, String department){
		this.uid = uid;
		this.name = name;
		this.email = email;
		this.year = year;
		this.department = department;
	}
}