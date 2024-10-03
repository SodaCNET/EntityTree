import React, { useState, useEffect, useRef, useCallback } from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import SortableTree from '@nosferatu500/react-sortable-tree';
import 'react-sortable-tree/style.css';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import LensIcon from '@mui/icons-material/Lens';
import { makeStyles } from '@mui/styles';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const useStyles = makeStyles((theme) => ({
  button: {
    marginTop: '5px',
    marginRight: '20px',
    fontSize: '0.9em', // Riduci la dimensione del testo
    padding: '6px 12px', // Riduci il padding per rendere i pulsanti più piccoli
    alignSelf: 'center', // Assicurati che i pulsanti siano allineati verticalmente al centro
  },
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    margin: '0px',
    background: '#009960',
  },
  title: {
    marginBottom: '0px',
    color: 'white',
    fontSize: '3em', // Riduci la dimensione del testo
    fontWeight: 'bold',
    textShadow: '1px 1px 1px black',
    fontFamily: 'calibri',
    alignSelf: 'center', // Assicurati che il titolo sia allineato verticalmente al centro
  },
  searchBar: {
    width: '400px', // Riduci la larghezza
    backgroundColor: 'white',
    fontSize: '0.9em',
    marginRight: '20px', // Aumenta lo spazio a destra
    alignSelf: 'center', // Assicurati che la barra di ricerca sia allineata verticalmente al centro
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0px',
    marginTop: '5px',
    gap: '10px',
    flexWrap: 'wrap',
    '& button': {
      transition: 'all 0.3s ease',
      fontSize: '0.9em', // Riduci la dimensione del testo
    },
  },
  treeContainer: {
    height: '100%',
    width: '100%',
    padding: '20px',
    borderRadius: '10px',
    backgroundColor: '#ffffff',
    boxShadow: '0px 0px 10px 0px rgba(0,0,0,0.75)',
    overflowY: 'auto',
  },
  input: {
    display: 'none',
  },
  legendDot: {
    height: '15px',
    width: '15px',
    borderRadius: '50%',
    display: 'inline-block',
    marginRight: '5px',
  },
  blueDot: {
    backgroundColor: 'blue',
  },
  greenDot: {
    backgroundColor: 'green',
  },
  goldDot: {
    backgroundColor: 'goldenrod',
  },
  legendLine: {
    display: 'flex',
    alignItems: 'center',
  },
  legendContainer: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: '10px', // Aggiungi padding per armonizzare con gli altri elementi
    borderRadius: '5px',
    boxShadow: '1px 1px 1px 1px rgba(0,0,0,0.2)',
    marginBottom: '0px',
    marginTop: '0px',
    flexWrap: 'wrap',
    marginRight: '20px',
    marginLeft: '20px', // Aumenta lo spazio a destra
    alignSelf: 'center', // Assicurati che la leggenda sia allineata verticalmente al centro
  },
  legendText: {
    fontSize: '1em', // Riduci la dimensione del testo
    marginRight: '10px',
  },
  customTooltip: {
    backgroundColor: 'lightgrey',
    color: 'black',
  },
}));

const Legend = () => {
  const classes = useStyles();
  return (
    <div className={classes.legendContainer} style={{ padding: '10px' }}> {/* Correzione qui */}

      <div>
        <span className={`${classes.legendDot} ${classes.blueDot}`}></span>
        <Typography component="span" className={classes.legendText}>Config</Typography>
      </div>
      <div>
        <span className={`${classes.legendDot} ${classes.goldDot}`}></span>
        <Typography component="span" className={classes.legendText}>Log</Typography>
      </div>
      <div>
        <span className={`${classes.legendDot} ${classes.greenDot}`}></span>
        <Typography component="span" className={classes.legendText}>Fatti</Typography>
      </div>
    </div>
  );
};

function transformData(data, parentId = null) {
  const result = [];

  if (Array.isArray(data)) {
    for (const item of data) {
      const newItem = {
        title: item.name,
        id: item.id,
        parentId: parentId,
        color: item.color ? item.color : null,
        children: item.children ? transformData(Object.values(item.children), item.id) : [],
        expanded: false,
        highlighted: false,
        hidden: item.hidden || false,
        foreignKeys: Array.isArray(item.foreign_keys) ? item.foreign_keys.map(fk => ({
          parentName: fk.ParentNameEntity,
          parentId: fk.ParentId_Entity.toString(), // Converte in stringa
          buttonColor: fk.ParentId_Entity.toString() === parentId ? true : false, // Assicura che il confronto sia tra stringhe
          isNullable: fk.isNullable === 'YES',
          ordinal: fk.OrdinalPosition, // Aggiunto OrdinalPosition
        })) : []
      };
      result.push(newItem);
    }
  } else {
    const newItem = {
      title: data.name,
      id: data.id,
      parentId: parentId,
      color: data.color ? data.color : null,
      children: data.children ? transformData(Object.values(data.children), data.id) : [],
      expanded: false,
      highlighted: false,
      hidden: data.hidden || false,
      foreignKeys: Array.isArray(data.foreign_keys) ? data.foreign_keys.map(fk => ({
        parentName: fk.ParentNameEntity,
        parentId: fk.ParentId_Entity.toString(), // Converte in stringa
        buttonColor: fk.ParentId_Entity.toString() === parentId ? true : false, // Assicura che il confronto sia tra stringhe
        isNullable: fk.isNullable === 'YES', // Converti la stringa in booleano
        ordinal: fk.OrdinalPosition, // Aggiunto OrdinalPosition
      })) : []
    };
    result.push(newItem);
  }

  // Calcola il numero totale di discendenti per ogni nodo
  const calculateTotalDescendants = (node) => {
    let total = 0;
    if (node.children) {
      for (const child of node.children) {
        total += 1 + calculateTotalDescendants(child);
      }
    }
    return total;
  };

  // Assegna il numero totale di discendenti a ogni nodo
  for (const node of result) {
    node.totalDescendants = calculateTotalDescendants(node);
  }

  // Ordina i nodi in base al numero totale di discendenti
  const sortNodesByDescendants = (nodes) => {
    return nodes.sort((a, b) => b.totalDescendants - a.totalDescendants).map(node => {
      if (node.children) {
        node.children = sortNodesByDescendants(node.children);
      }
      return node;
    });
  };

  return sortNodesByDescendants(result);
}

function revertTransformData(transformedData) {
  return transformedData.map(item => {
    const originalItem = {
      name: item.title,
      id: item.id,
      ...(item.color && { color: item.color }), // Includi la proprietà color se esiste
      children: item.children && item.children.length > 0 ? revertTransformData(item.children) : undefined,
      foreign_keys: item.foreignKeys ? item.foreignKeys.map(fk => ({
        ParentNameEntity: fk.parentName,
        ParentId_Entity: parseInt(fk.parentId, 10), // Converte la stringa in un numero
        buttonColor: fk.buttonColor, // Include il colore del pulsante
        isNullable: fk.isNullable ? 'true' : 'false', // Converti booleano in stringa
        OrdinalPosition: fk.ordinal, // Include OrdinalPosition
      })) : [],
      hidden: item.hidden

    };
    return originalItem;
  });
}

const getTotalDescendants = (node) => {
  if (!node.children) {
    return 0;
  }
  let total = node.children.length;
  for (let child of node.children) {
    total += getTotalDescendants(child);
  }
  return total;
};

const Tree = () => {
  const classes = useStyles();
  const [treeData, setTreeData] = useState([]);
  const [searchOptions, setSearchOptions] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [highlightedNodeId, setHighlightedNodeId] = useState(null);
  const nodeRefs = useRef({});
  const treeContainerRef = useRef(null);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');
  const [hiddenstate, setHiddenState] = useState(false);
  const [nomeBottoneCheck, setNomeBottone] = useState('Nascondi ✔');
  const [showNodes, setShowNodes] = useState(true);
  const treeRef = useRef(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (isMounted) {
      const node = treeRef.current;
      if (node) {
        // Esegui operazioni sul nodo DOM
      }
    }
  }, [isMounted]);

  function handleNomeBottoneCheck() {
    setShowNodes(!showNodes);
  }

  const MostraNascondiNodi = () => {
    if (hiddenstate) {
      setHiddenState(false);
      setNomeBottone('Nascondi ✔');
      handleNomeBottoneCheck()
      return;
    } else {
      setHiddenState(true);
      setNomeBottone('Mostra ✔');
      handleNomeBottoneCheck()
      return;
    }
  }


  useEffect(() => {
    if (treeContainerRef.current) {
      console.log('treeContainerRef:', treeContainerRef.current);
      // Qui puoi accedere a treeContainerRef.current per manipolare l'elemento del DOM
    }
  }, []);


  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = JSON.parse(event.target.result);
      // Assicurati che i dati contengano tutte le informazioni necessarie, inclusi i nodi figli
      let transformedData = transformData(data);
      setTreeData(transformedData);
    };
    reader.readAsText(file);
  };

  const exportToJson = () => {
    if (hiddenstate) {
      MostraNascondiNodi()
    }
    const userName = prompt('Inserisci il tuo nome utente:');
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Mesi da 0 a 11
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const fileName = `${userName}_${year}.${month}.${day}_${hours}.${minutes}.json`;
    const originalFormatData = revertTransformData(treeData);
    const jsonString = JSON.stringify(originalFormatData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  function findParentNodeById(treeData, nodeId) {
    // Funzione ausiliaria ricorsiva per cercare il nodo
    function searchNode(currentNode, parentId) {
      // Controlla se il nodo corrente ha figli
      if (currentNode.children && currentNode.children.length > 0) {
        // Itera sui figli del nodo corrente
        for (const child of currentNode.children) {
          // Se l'ID del figlio corrisponde a nodeId, restituisce il nodo corrente (il genitore)
          if (child.id === nodeId) {
            return currentNode; // Restituisce il genitore
          }
          // Altrimenti, continua la ricerca ricorsivamente nei figli
          const foundParent = searchNode(child, currentNode.id);
          if (foundParent) return foundParent; // Se trova il genitore nei sottoalberi, lo restituisce
        }
      }
      // Se il nodo non ha figli o l'ID non viene trovato, restituisce null
      return null;
    }

    // Inizia la ricerca dal nodo radice
    for (const rootNode of treeData) {
      if (rootNode.id === nodeId) {
        // Se l'ID corrisponde al nodo radice, significa che non ha un genitore
        return null;
      }
      const parent = searchNode(rootNode, null);
      if (parent) return parent; // Restituisce il genitore se trovato
    }

    // Restituisce null se il nodo con l'ID specificato non viene trovato nell'albero
    return null;
  }

  // Aggiungi questa funzione nel componente React che gestisce l'albero
  function handleColorButtonClick(nodeId, strongColor) {
    const weakColor = strongColor === 'goldenrod' ? 'palegoldenrod' : 'lightgreen';
    const strongColors = ['goldenrod', 'green', 'blue']; // Colori che non devono essere sovrascritti

    // Trova il nodo corrispondente all'ID e applica il colore debole ai suoi figli
    const rootNode = findNodeById(treeData, nodeId); // Assumendo che treeData sia lo stato che contiene i dati dell'albero

    // Se il nodo è colorato di blue o lightblue, e si tenta di applicare green o goldenrod, non fare nulla
    if ((rootNode.color === 'blue' || rootNode.color === 'lightblue') && (strongColor === 'green' || strongColor === 'goldenrod')) {
      showSnackbar("Rimuovi il colore dal nodo prima di applicarne uno nuovo");
      return;
    }
    if (rootNode) {
      // Se il nodo ha già il colore selezionato, rimuovi il colore e applica la logica di colore secondario
      if (rootNode.color === strongColor) {
        if (strongColor === 'blue') {
          rootNode.color = null;
          if (checkChildrenForBlue(rootNode)) {
            rootNode.color = 'lightblue';
          }
          removeBlueFromAncestors(treeData, rootNode.id, strongColors); // Nuova funzione per gestire gli antenati
          setTreeData([...treeData]);
        } else {
          // Determina il colore secondario appropriato
          const secondaryColor = determineSecondaryColor(nodeId);
          // Applica il colore secondario
          applySecondaryColor(rootNode, secondaryColor);
          setTreeData([...treeData]);
        }
      } else {
        if ((rootNode.color !== 'blue' && rootNode.color !== 'lightblue' && rootNode.color !== null) && strongColor === 'blue') {
          return
        } else {
          rootNode.color = strongColor;
        }
        // Se il colore forte è blu, applica lightblue ai genitori
        if (strongColor === 'blue') {
          applyLightBlueToParents(treeData, rootNode.id, strongColors);
        } else {
          applyWeakColorToChildren(rootNode, weakColor, strongColors);
        }
        // Aggiorna lo stato dell'albero per riflettere i cambiamenti
        setTreeData([...treeData]);
      }
    }
  }

  function applyWeakColorToChildren(node, weakColor, strongColors) {
    // Controlla se il nodo ha figli
    if (node.children && node.color !== 'blue') {
      for (const child of node.children) {
        // Applica il colore debole solo se il nodo corrente non ha un colore forte
        if (!strongColors.includes(child.color)) {
          child.color = weakColor;
        } else continue;
        // Continua ricorsivamente per i figli del nodo corrente
        applyWeakColorToChildren(child, weakColor, strongColors);
      }
    }
  }

  function applyLightBlueToParents(treeData, nodeId, strongColors) {
    const path = findNodePathById(treeData, nodeId);
    if (path) {
      // Naviga attraverso l'albero seguendo il percorso per raggiungere il nodo desiderato
      let currentNode = treeData;
      for (let i = 0; i < path.length - 1; i++) { // Esclude l'ultimo elemento (il nodo stesso)
        currentNode = currentNode[path[i]]; // Aggiorna il nodo corrente seguendo il percorso

        // Applica lightblue solo se il nodo non ha un colore forte
        if (!strongColors.includes(currentNode.color)) {
          currentNode.color = 'lightblue';
        }

        // Passa ai figli del nodo corrente per il prossimo ciclo
        currentNode = currentNode.children;
      }
    }
  }

  function checkChildrenForBlue(node) {
    if (node.color === 'blue') {
      return true;
    }
    if (node.children) {
      for (const child of node.children) {
        if (checkChildrenForBlue(child)) {
          return true;
        }
      }
    }
    return false;
  }


  function removeBlueFromAncestors(treeData, nodeId) {
    // Funzione ausiliaria per trovare il percorso dal nodo radice al nodo specificato
    function findPath(node, id, path = []) {
      if (node.id === id) {
        return path;
      }
      if (node.children) {
        for (let i = 0; i < node.children.length; i++) {
          const newPath = findPath(node.children[i], id, [...path, node]);
          if (newPath) {
            return newPath;
          }
        }
      }
      return null;
    }

    // Controlla se esistono fratelli o figli di colore blu
    function hasBlueSiblingsOrChildren(node, nodeId) {
      // Controlla i fratelli
      const parent = findParentNodeById(treeData, nodeId);
      if (parent && parent.children) {
        if (parent.children.some(sibling => sibling.id !== nodeId && sibling.color === 'blue')) {
          return true;
        }
      }
      // Controlla i figli ricorsivamente

      return checkChildrenForBlue(node);
    }

    function checkChildrenForBlue(node) {
      if (node.color === 'blue') {
        return true;
      }
      if (node.children) {
        for (const child of node.children) {
          if (checkChildrenForBlue(child)) {
            return true;
          }
        }
      }
      return false;
    }

    // Rimuove il colore dai nodi genitori fino a incontrare un nodo blu o fratelli/figli blu
    function removeColorFromAncestors(path) {
      for (let i = path.length - 1; i >= 0; i--) { // Inizia dall'ultimo genitore
        const node = path[i];
        if (node.color === 'blue' || hasBlueSiblingsOrChildren(node, nodeId)) {
          break; // Interrompe se incontra un nodo blu o fratelli/figli blu
        }
        // Se il nodo ha figli blu, imposta il colore a lightblue
        if (checkChildrenForBlue(node)) {
          node.color = 'lightblue';
        } else {
          node.color = null; // Rimuove il colore
        }
      }
    }

    const rootNode = treeData.find(node => node.id === nodeId) || treeData[0]; // Assumendo che treeData sia un array di nodi radice
    const path = findPath(rootNode, nodeId);
    if (path) {
      removeColorFromAncestors(path);
    }
  }


  function determineSecondaryColor(nodeId) {
    const parentNode = findParentNodeById(treeData, nodeId);
    const strongColors = ['goldenrod', 'green']; // Colori forti
    const weakColors = ['palegoldenrod', 'lightgreen'];

    const weakColorMapping = { // Mappatura da colore forte a colore debole
      'goldenrod': 'palegoldenrod',
      'green': 'lightgreen'
    };

    if (parentNode.color !== 'blue' || parentNode.color !== 'lightblue') {
      // Se il padre esiste e ha un colore forte, ritorna il colore debole corrispondente
      if (parentNode && strongColors.includes(parentNode.color)) {
        return weakColorMapping[parentNode.color] || 'lightgrey'; // 'lightgrey' come fallback
      } else if (parentNode && weakColors.includes(parentNode.color)) {
        return parentNode.color; // Se il padre ha un colore debole, ritorna lo stesso colore
      } else return null; // Se non esiste un padre o il padre non ha un colore, ritorna null
    } else return null;

  }

  function applySecondaryColor(node, color) {
    if (color !== 'blue' || color !== 'lightblue' || color !== null) {
      // Applica il colore secondario al nodo e propaga ai nodi correlati se necessario
      node.color = color;
      // Esempio di propagazione ai figli, potrebbe essere necessario aggiungere logica per i padri
      if (node.children) {
        for (const child of node.children) {
          if (!['goldenrod', 'green', 'blue'].includes(child.color)) { // Non sovrascrivere i colori "forti"
            child.color = color;
            applySecondaryColor(child, color); // Ricorsione per propagare il colore
          }
        }
      }
    } else {
      return;
    }
  }

  // function updateColorButton(nodeId) {
  //   const rootNode = findNodeById(treeData, nodeId); // Assumendo che treeData sia lo stato che contiene i dati dell'albero
  //   if (rootNode) {
  //       // Determina il colore secondario appropriato
  //       const secondaryColor = determineSecondaryColor(nodeId);
  //       // Applica il colore secondario
  //       applySecondaryColor(rootNode, secondaryColor);
  //       setTreeData([...treeData]);
  //   }
  // }


  const handleRemoveAllColors = () => {
    const removeAllColors = (node) => ({
      ...node,
      color: null,
      children: node.children ? node.children.map(removeAllColors) : [],
    });

    const newTreeData = treeData.map(removeAllColors);
    setTreeData(newTreeData);
  };

  useEffect(() => {
    const options = [];
    const generateOptions = (nodes, path = []) => {
      for (let i = 0; i < nodes.length; i++) {
        const newPath = path.concat(i);
        // Includi l'id nella creazione delle opzioni
        options.push({ title: nodes[i].title, id: nodes[i].id, path: newPath });
        if (nodes[i].children) {
          generateOptions(nodes[i].children, newPath);
        }
      }
    };
    generateOptions(treeData);
    setSearchOptions(options);
  }, [treeData]);


  const HandleCloseAllNodes = useCallback(() => {
    const closeAllNodes = (node) => ({
      ...node,
      expanded: false,
      children: node.children ? node.children.map(closeAllNodes) : [],
    });
    const newTreeData = treeData.map(closeAllNodes);
    setTreeData(newTreeData);
  }, [treeData]);

  // Funzione migliorata per espandere i nodi lungo un percorso
  const expandPathNodes = useCallback((treeData, path) => {
    const expandNodes = (nodes, currentPath) => {
      return nodes.map((node, index) => {
        const newPath = currentPath.concat(index);
        if (path.length > newPath.length && path[newPath.length - 1] === index) {
          return {
            ...node,
            expanded: true,
            children: node.children ? expandNodes(node.children, newPath) : [],
          };
        }
        return node;
      });
    };
    return expandNodes(treeData, []);
  }, []);


  const scrollToNode = useCallback((nodeId) => {
    if (treeContainerRef.current) {
      const nodeElement = treeContainerRef.current.querySelector(`[data-node-id="${nodeId}"]`);
      if (nodeElement) {
        nodeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, []);

  const handleSearchChange = useCallback((event, value) => {
    HandleCloseAllNodes();

    setTimeout(() => {
      setSelectedNode(value);

      if (value === null) {
        setHighlightedNodeId(null);
      } else {
        setHighlightedNodeId(value.id);

        if (value.path) {
          const newTreeData = expandPathNodes(treeData, value.path);
          setTreeData(newTreeData);
        }
      }
    }, 100);
  }, [treeData, HandleCloseAllNodes, expandPathNodes]);



  const handleSearch = useCallback(() => {
    if (selectedNode) {
      const path = selectedNode.path;
      const nodeId = selectedNode.id;

      // Espandi i nodi lungo il percorso
      const newTreeData = expandPathNodes(treeData, path);
      setTreeData(newTreeData);

      // Scorri fino al nodo selezionato dopo un breve ritardo
      setTimeout(() => {
        scrollToNode(nodeId);
      }, 100);
    }
  }, [selectedNode, treeData, expandPathNodes, scrollToNode]);

  // Gestire l'evento di click sulla foreign key
  const handleForeignKeyClick = (node, nodeId, foreignParentId) => {
    console.log(`Nodo: ${nodeId}, Nodo genitore: ${foreignParentId}`);
    const targetNodePath = findNodePathById(treeData, foreignParentId);
    if (!targetNodePath) {
      console.error("Nodo target non trovato.");
      return;
    }

    // Trova il nodo target
    const targetNode = findNodeById(treeData, foreignParentId);
    if (!targetNode) {
      console.error('Nodo non trovato nel percorso specificato:', targetNodePath);
      return; // Esce dalla funzione se il nodo non viene trovato
    }

    // Trova il nodo corrente
    const currentNode = findNodeById(treeData, nodeId);

    // Trova il genitore del nodo corrente e rimuovi il nodo corrente dai suoi figli
    const removeNodeFromParent = (treeData, nodeId) => {
      const findAndRemoveNode = (nodes, nodeId) => {
        return nodes.map(node => {
          if (node.children) {
            const filteredChildren = node.children.filter(child => child.id !== nodeId);
            return { ...node, children: findAndRemoveNode(filteredChildren, nodeId) };
          }
          return node;
        });
      };
      return findAndRemoveNode(treeData, nodeId);
    };

    // Aggiungi il nodo corrente come figlio del nodo target
    const addNodeToTarget = (treeData, targetNodeId, nodeToAdd) => {
      const findAndAddNode = (nodes, targetNodeId, nodeToAdd) => {
        return nodes.map(node => {
          if (node.id === targetNodeId) {
            const newChildren = node.children ? [...node.children, nodeToAdd] : [nodeToAdd];
            return { ...node, children: newChildren };
          } else if (node.children) {
            return { ...node, children: findAndAddNode(node.children, targetNodeId, nodeToAdd) };
          }
          return node;
        });
      };
      return findAndAddNode(treeData, targetNodeId, nodeToAdd);
    };

    // Funzione per spostare un nodo
    const moveNode = (treeData, nodeId, targetNodeId) => {
      let nodeToMove = null;

      // Trova il nodo da spostare
      const findNode = (nodes, nodeId) => {
        nodes.forEach(node => {
          if (node.id === nodeId) {
            nodeToMove = { ...node };
            return;
          }
          if (node.children) {
            findNode(node.children, nodeId);
          }
        });
      };

      findNode(treeData, nodeId);

      if (!nodeToMove) {
        console.error("Nodo non trovato");
        return treeData;
      }

      // Rimuovi il nodo dal suo genitore
      let newTreeData = removeNodeFromParent(treeData, nodeId);

      // Aggiungi il nodo al nodo target
      newTreeData = addNodeToTarget(newTreeData, targetNodeId, nodeToMove);

      return newTreeData;
    };

    // Utilizza moveNode per spostare il nodo
    let newTreeData = moveNode(treeData, currentNode.id, targetNode.id);
    setTreeData(newTreeData);
    updateForeignKeyButtonColors(newTreeData, foreignParentId, nodeId);
  };



  // Funzioni ausiliarie per trovare un nodo, il suo percorso e il nodo genitore
  function findNodePathById(treeData, id, path = []) {
    for (let i = 0; i < treeData.length; i++) {
      const item = treeData[i];
      if (item.id === id) {
        return path.concat(i);
      }
      if (item.children) {
        const childPath = findNodePathById(item.children, id, path.concat(i));
        if (childPath) {
          return childPath;
        }
      }
    }
    return null;
  }

  function findNodeById(treeData, id) {
    let node = null;
    if (!treeData) {
      console.error('treeData is null or undefined');
      return null;
    }
    treeData.some(item => {
      if (item.id === id) {
        node = item;
        return true;
      }
      if (item.children) {
        node = findNodeById(item.children, id);
        if (node) return true;
      }
      return false;
    });
    return node;
  }

  function updateForeignKeyButtonColors(treeData, nodeId, specificNodeId) {
    // Assicura che nodeId e specificNodeId siano definiti, altrimenti assegna una stringa vuota
    const nodeIdString = nodeId ? nodeId.toString() : '';
    const specificNodeIdString = specificNodeId ? specificNodeId.toString() : '';

    const updateSpecificNode = (nodes) => {
      nodes.forEach(node => {
        if (node.id.toString() === specificNodeIdString) {
          if (node.foreignKeys) {
            node.foreignKeys = node.foreignKeys.map(fk => ({
              ...fk,
              buttonColor: fk.parentId === nodeIdString
            }));
          }
        }
        if (node.children) {
          updateSpecificNode(node.children);
        }
      });
    };

    updateSpecificNode(treeData);
    updateSortNodes(treeData);
  }

  // Ordina i nodi in base al numero totale di discendenti
  const updateSortNodes = (nodes) => {
    return nodes.sort((a, b) => b.totalDescendants - a.totalDescendants).map(node => {
      if (node.children) {
        node.children = updateSortNodes(node.children);
      }
      return node;
    });
  };

  // Funzione per filtrare i nodi nascosti
  function filterHiddenNodes(nodes) {
    return nodes
      .filter(node => !node.hidden) // Filtra i nodi nascosti
      .map(node => ({
        ...node,
        children: filterHiddenNodes(node.children) // Applica ricorsivamente ai figli
      }));
  }

  // Funzione per gestire il click sul tasto mostra/nascondi
  function handleToggleVisibility(nodeId) {
    const toggleNodeVisibility = (nodes) => {
      return nodes.map(node => {
        if (node.id === nodeId) {
          return { ...node, hidden: !node.hidden };
        }
        if (node.children) {
          return { ...node, children: toggleNodeVisibility(node.children) };
        }
        return node;
      });
    };

    const updatedTreeData = toggleNodeVisibility(treeData);
    setTreeData(updatedTreeData);
  }

  const filteredTreeData = showNodes ? treeData : filterHiddenNodes(treeData);


  return (
    <div ref={treeRef} className={classes.root} >
      <div container spacing={2} className={classes.buttonGroup} alignItems="center" justifyContent="flex-start">
        <div item xs={12} style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            {/* Upload e Export JSON qui */}
            <input
              accept=".json"
              className={classes.input}
              id="contained-button-file"
              type="file"
              onChange={handleFileUpload}
            />
            <label htmlFor="contained-button-file">
              <Button variant="contained" color="primary" component="span" className={classes.button} >
                Import
              </Button>
            </label>
            <Button variant="contained" color="primary" className={classes.button} onClick={exportToJson}>
              Export
            </Button>
          </div>
          <Typography variant="contained" className={classes.title}>
            EntityTree
          </Typography>
          <Legend />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Box di ricerca qui */}
            <Autocomplete
              options={searchOptions}
              getOptionLabel={(option) => option.title}
              className={classes.searchBar}
              onChange={handleSearchChange}
              renderInput={(params) => <TextField {...params} variant="outlined" />}
              getOptionSelected={(option, value) => option.id === value.id}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            />
          </div>
          <div>
            <Button variant="contained" color="primary" onClick={handleSearch} className={classes.button}>
              Go to
            </Button>
            {/* Remove All Colors e Close all nodes qui */}
            <Button variant="contained" color="primary" className={classes.button} onClick={MostraNascondiNodi}>
              {nomeBottoneCheck}
            </Button>
            <Button variant="contained" color="secondary" className={classes.button} onClick={handleRemoveAllColors}>
              Remove All Colors
            </Button>
            <Button variant="contained" color="secondary" className={classes.button} onClick={HandleCloseAllNodes}>
              Close All Nodes
            </Button>
          </div>
        </div>
      </div>
      <Snackbar open={snackbarOpen} autoHideDuration={2500} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'top', horizontal: 'left' }}>
        <Alert onClose={handleCloseSnackbar} severity="error" variant="filled" sx={{ width: '80%', bgcolor: 'firebrick', color: 'white', fontWeight: 'bold', borderRadius: '6px', boxShadow: '0px 3px 5px rgba(0,0,0,0.3)' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
      <div ref={treeContainerRef} className={classes.treeContainer} >
        <SortableTree
          treeData={filteredTreeData}
          onChange={newTreeData => {
            setTreeData(newTreeData);
          }}
          canDrag={false}
          generateNodeProps={({ node, path }) => ({
            'data-node-id': node.id, // Aggiungi un attributo data per identificare il nodo
            onClick: () => {
              setSelectedNode({ id: node.id, path });
            },
            style: {
              boxShadow: node.id === highlightedNodeId ? '0px 0px 15px 10px rgba(100,245,180, 0.95)' : '',
              borderRadius: '10px', // Aggiunta per arrotondare gli angoli,
            },
            title: (
              <div style={{
                display: 'flex',
                alignItems: 'center',
              }}>
                {/* Aggiunta del numero di discendenti con colore condizionale */}
                <IconButton style={{ padding: 0 }} onClick={(event) => { event.stopPropagation(); handleColorButtonClick(node.id, 'blue'); }}>
                  <LensIcon style={{ color: 'blue' }} />
                </IconButton>
                <IconButton style={{ padding: 0 }} onClick={(event) => { event.stopPropagation(); handleColorButtonClick(node.id, 'goldenrod'); }}>
                  <LensIcon style={{ color: 'goldenrod' }} />
                </IconButton>
                <IconButton style={{ padding: 0 }} onClick={(event) => { event.stopPropagation(); handleColorButtonClick(node.id, 'green'); }}>
                  <LensIcon style={{ color: 'green' }} />
                </IconButton>
                <span style={{
                  fontWeight: 'bold',
                  marginRight: '15px',
                  marginLeft: '15px',
                  color: getTotalDescendants(node) > 70 ? 'red' : getTotalDescendants(node) > 35 ? 'gold' : getTotalDescendants(node) > 5 ? '#EED202' : getTotalDescendants(node) > 0 ? 'green' : 'blue',
                }}>
                  {getTotalDescendants(node)}
                </span>
                <span>
                  <input type="checkbox" checked={node.hidden} onChange={(event) => { event.stopPropagation(); handleToggleVisibility(node.id); }} />
                </span>
                <div ref={el => nodeRefs.current[node.id] = el} data-node-id={node.id} style={{
                  backgroundColor: node.color,
                  padding: '10px',
                  borderRadius: '10px', // Aggiunta per arrotondare gli angoli
                  color: ['blue', 'green', 'goldenrod'].includes(node.color) ? 'white' : 'black',
                }}>
                  <div>
                    <span>{node.title}</span>
                  </div>
                </div>
                <span>
                  {node.foreignKeys && node.foreignKeys.length > 0 && node.foreignKeys.map((fk, index) => (
                    <Tooltip title={`Nullable: ${fk.isNullable ? 'Yes' : 'No'}`} key={index} classes={{ tooltip: classes.customTooltip }}>
                      <Button
                        key={index}
                        onClick={(event) => { event.stopPropagation(); handleForeignKeyClick(node, node.id, fk.parentId); }}
                        variant="contained"
                        color="default"
                        style={{
                          textTransform: 'none',
                          backgroundColor: fk.buttonColor === true ? 'lightgray' : 'grey',
                          color: fk.buttonColor === true ? 'black' : 'white',
                          pointerEvents: fk.buttonColor === true ? 'none' : 'auto', // Disabilita gli eventi del mouse se non cliccabile
                          opacity: fk.buttonColor === true ? 0.5 : 1, // Riduce l'opacità per indicare che non è cliccabile
                          fontFamily: 'calibri',
                          fontWeight: fk.isNullable === true ? 'lighter' : 'bolder',
                          fontStyle: fk.isNullable === true ? 'italic' : 'normal',
                          fontSize: fk.isNullable === true ? '0.67em' : '0.8em',
                          boxShadow: '0px 1px 0px 1px rgba(0,0,0,0.3)',
                          marginLeft: '4px',
                          padding: '4px',
                          borderRadius: '8px', // Aggiunta per arrotondare gli angoli
                        }}
                      >
                        {fk.parentName}
                      </Button>
                    </Tooltip>
                  ))}
                </span>
              </div>
            ),

          })}
          indentWidth={30}
        />
      </div>
    </div>
  );
};

export default Tree;