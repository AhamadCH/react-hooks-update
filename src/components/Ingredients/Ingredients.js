import React, { useEffect, useCallback, useReducer, useMemo } from "react";

import IngredientForm from "./IngredientForm";
import IngredientList from "./IngredientList";
import ErrorModal from "../UI/ErrorModal";
import Search from "./Search";

const ingredientReducer = (currentIngredients, action) => {
  switch (action.type) {
    case 'SET':
      return action.ingredients;
    case 'ADD':
      return [...currentIngredients, action.ingredient];
    case 'DELETE':
      return currentIngredients.filter(ingredient => ingredient.id !== action.id);
    default:
      throw new Error('Should not get there!');
  }
}

const httpReducer = (curHttpState, action) => {
  switch (action.type) {
    case "SEND":
      return {loading: true, error: null};
    case "RESPONSE":
      return {...curHttpState, loading: false};
    case "ERROR":
      return {loading: false, error: action.error};
    case "CLEAR":
      return {...curHttpState, error: null};
    default:
      throw new Error("Should not get there!");
  }
};

const Ingredients = () => {
  // const [ingredients, setIngredients] = useState([]);
  const [httpState, dispatchHttp] = useReducer(httpReducer, {loading: false, error: null });
  const [ingredients, dispatch] = useReducer(ingredientReducer, []);
  // const [isLoading, setIsLoading] = useState(false);
  // const [error, setError] = useState('');

  useEffect(() => {
    fetch("https://udemyreact-hooks.firebaseio.com/ingredients.json")
      .then(response => {
        return response.json();
      })
      .then(responseData => {
        const loadedIngredients = [];
        for (const key in responseData) {
          loadedIngredients.push({
            id: key,
            title: responseData[key].title,
            amount: responseData[key].amount
          });
        }
        // setIngredients(loadedIngredients);
        dispatch({
          type: 'SET',
          ingredients: loadedIngredients
        });
      });
  }, []);

  const filteredIngredientsHandler = useCallback(filteredIngredients => {
    // setIngredients(filteredIngredients);
    dispatch({
      type: "SET",
      ingredients: filteredIngredients
    });
  }, []);

  const addIngredientHandler = useCallback(ingredient => {
    // setIsLoading(true);
    dispatchHttp({ type: 'SEND' });
    fetch("https://udemyreact-hooks.firebaseio.com/ingredients.json", {
      method: "POST",
      body: JSON.stringify(ingredient),
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then(response => {
        // setIsLoading(false);
        dispatchHttp({ type: 'RESPONSE' });
        return response.json();
      })
      .then(responseData => {
        // setIngredients(prevIngredients => [
        //   ...prevIngredients,
        //   {
        //     id: responseData.name,
        //     ...ingredient
        //   }
        // ]);
        dispatch({
          type: "ADD",
          ingredient: {
            id: responseData.name,
            ...ingredient
          }
        });
      });
  }, []);

  const removeIngredientHandler = useCallback(ingredientId => {
    // setIsLoading(true);
    dispatchHttp({ type: "SEND" });
    fetch(`https://udemyreact-hooks.firebaseio.com/ingredients/${ingredientId}.json`, {
      method: "DELETE"
    }
    ).then(response => {
      dispatchHttp({ type: "RESPONSE" });
      // setIsLoading(false);
      // setIngredients(prevIngredients =>
      //   prevIngredients.filter(ingredient => ingredient.id !== ingredientId)
      // );
      dispatch({
        type: "DELETE",
        id: ingredientId
      });
    }).catch(error => {
      // setError('Something went wrong!');
      // setIsLoading(false);
      dispatchHttp({
        type: "ERROR",
        error: "Something went wrong"
      });
    });
  }, []);

  const clearError = useMemo(() => {
    // setError(null);
    dispatchHttp({type: "CLEAR"});
  });

  const ingredientList = useMemo(() => {
    return (
      <IngredientList
        ingredients={ingredients}
        onRemoveItem={removeIngredientHandler}
      />
    );
  }, [ingredients, removeIngredientHandler]);

  return (
    <div className="App">
      {httpState.error && <ErrorModal onClose={clearError}>{httpState.error}</ErrorModal>}
      <IngredientForm
        onAddIngredient={addIngredientHandler}
        isLoading={httpState.loading}
      />

      <section>
        <Search onLoadIngredients={filteredIngredientsHandler} />
        {ingredientList}
      </section>
    </div>
  );
};

export default Ingredients;
