
let auth0 = null;
const fetchAuthConfig = () => fetch("/auth_config.json");
const fetchEndpointConfig = async () => fetch("/endpoint");
const configureClient = async () => {
    const response = await fetchAuthConfig();
    const config = await response.json();    
  
    auth0 = await createAuth0Client({
      domain: config.domain,
      client_id: config.clientId,
      audience: config.audience,
    });
  };

const login = async () => {
    await auth0.loginWithRedirect({
        redirect_uri: window.location.origin
    });
};

const logout = async () => {
    await auth0.logout({
        returnTo: window.location.origin
    });
};

window.onload = async () => {
    //document.getElementById('btnGetData').addEventListener("click", getdata);
    document.getElementById('btnLogout').addEventListener("click", logout);
    document.getElementById('btnLogin').addEventListener("click", login);

    await configureClient();
    updateUI();

    //must be included to handle redirect!
    const query = window.location.search;

    if (query.includes("code=") && query.includes("state=")) {
        // Process the login state
        await auth0.handleRedirectCallback();
        
        updateUI();

        // Use replaceState to redirect the user away and remove the querystring parameters
        window.history.replaceState({}, document.title, "/");
    }

    

    const isAuthenticated = await auth0.isAuthenticated();
    console.log(isAuthenticated)
    updateUI();
    if (isAuthenticated) {
        console.log(isAuthenticated)
        await getdata()
        if (query.includes("ticket=")) {
          let urlParams = new URLSearchParams(window.location.search)
          await getTicketInfo(urlParams.get("ticket"))
        }
        else if (localStorage.getItem("callback")!=null) {
          window.history.replaceState(null, null, "?ticket=" + localStorage.getItem("callback"))
          await getTicketInfo(localStorage.getItem("callback"))
          localStorage.clear()
        }
        // show the gated content
        return;
    } else {
      await getTicketCount()
    }

    if (query.includes("ticket=")) {
      let urlParams = new URLSearchParams(window.location.search)
      localStorage.setItem("callback", urlParams.get("ticket"))
      await auth0.loginWithRedirect({
        redirect_uri : window.location.origin
      })
  }

    // if (window.location.pathname.includes("/ticket/")) {
    //   localStorage.setItem("callback", window.location.href)
    //   await auth0.loginWithRedirect({
    //     redirect_uri : window.location.origin
    //   })
    // }
    
  };

  const updateUI = async () => {
    const isAuthenticated = await auth0.isAuthenticated();
    document.getElementById('btnLogin').style.display = isAuthenticated ? "none" : "block" ;
    document.getElementById('btnLogout').style.display = isAuthenticated ? "block" : "none" ;
  }

const uriResponse = fetchEndpointConfig();
const serverUri = uriResponse.body;
console.log(serverUri)

const getTicketInfo = async uuid => {
    try {    
      // Get the access token from the Auth0 client
      const token = await auth0.getTokenSilently();      
  
      // Make the call to the API, setting the token
      // in the Authorization header
      const response = await fetch(`${serverUri}/ticket/${uuid}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
  
      // Fetch the JSON result
      const responseData = await response.json();
      console.log(uuid)
      console.log(responseData)
  
      document.getElementById('content').appendChild(document.createElement("br"));
      document.getElementById('content').append("Vatin: " + responseData["vatin"]);        
      document.getElementById('content').appendChild(document.createElement("br"));        
      document.getElementById('content').append("First name: " + responseData["firstName"]);
      document.getElementById('content').appendChild(document.createElement("br"));        
      document.getElementById('content').append("Last name: " + responseData["lastName"]);
      document.getElementById('content').appendChild(document.createElement("br"));        
      document.getElementById('content').append("Date generated: " + responseData["dateGenerated"]);
      document.getElementById('content').appendChild(document.createElement("br"));             
  
  } catch (e) {
      // Display errors in the console
      document.getElementById('content').innerHTML = e;     
    }
  };

  const getdata = async () => {
    try {    
      // Get the access token from the Auth0 client
      const token = await auth0.getTokenSilently();      
  
      // Make the call to the API, setting the token
      // in the Authorization header
      const response = await fetch(`${serverUri}/userInfo`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
  
      // Fetch the JSON result
      const responseData = await response.json();
      console.log(responseData)
      const user = JSON.parse(responseData)
  
      document.getElementById('content').append("Logged user: " + user["name"]);        
  
  } catch (e) {
      // Display errors in the console
      document.getElementById('content').innerHTML = e;     
    }
  };

  const getTicketCount = async () => {
    try {    
      // Make the call to the API, setting the token
      // in the Authorization header
      let serverUri = await fetchEndpointConfig().body;
      const response = await fetch(`${serverUri}/ticketCount`);
  
      // Fetch the JSON result
      const responseData = await response.json();
      console.log(responseData)
  
      document.getElementById('content').append("Tickets count: " + responseData["count"]);        
  
  } catch (e) {
      // Display errors in the console
      document.getElementById('content').innerHTML = e;     
    }
  };

