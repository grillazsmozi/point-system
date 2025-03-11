if (window.sessionStorage.getItem("logged") !== "true" && window.sessionStorage.getItem("admin-logged") !== "true") { 
    window.location.replace("/"); 
}