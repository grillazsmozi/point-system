if (window.sessionStorage.getItem("admin-logged") !== "true") { 
    window.location.replace("/admin/login"); 
}