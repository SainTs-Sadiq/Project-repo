import os
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
from recifine.inferencing.inference import ReciFineNER

MODEL=os.getenv('RECIFINE_MODEL','recipebert')
API_TOKEN=os.getenv('NER_SERVICE_TOKEN')
app=FastAPI(title='Intelligent Food Procurement NER Service')
ner=ReciFineNER.from_pretrained(model=MODEL,task_formulation='traditional')

class Payload(BaseModel):
    text:str
    task:str='food-ner'
    entity_types:list[str]|None=None

@app.get('/health')
def health(): return {'ok':True,'model':MODEL}

@app.post('/predict')
def predict(payload:Payload, authorization:str|None=Header(default=None)):
    if API_TOKEN and authorization!=f'Bearer {API_TOKEN}': raise HTTPException(401,'Unauthorized')
    if not payload.text.strip(): raise HTTPException(400,'text is required')
    result=ner.process_text(payload.text)
    answer=result if isinstance(result,list) else []
    entities=[]
    # ReciFine returns grouped answers; convert its supported recipe entities to our API contract.
    if answer and isinstance(answer[0],dict) and 'answer' in answer[0]:
        grouped=answer[0].get('answer',{})
        for label,values in grouped.items():
            for value in values if isinstance(values,list) else [values]:
                typ={'FOOD':'INGREDIENT','QUANTITY':'QUANTITY','FOOD_STATE':'DISH'}.get(label)
                if typ: entities.append({'text':value,'type':typ,'confidence':None})
    elif isinstance(answer,list):
        for item in answer:
            if not isinstance(item,dict): continue
            label=str(item.get('entity_group') or item.get('entity') or '').upper()
            typ={'FOOD':'INGREDIENT','QUANTITY':'QUANTITY','FOOD_STATE':'DISH'}.get(label.replace('B-','').replace('I-',''))
            if typ: entities.append({'text':item.get('word') or item.get('text'),'type':typ,'start':item.get('start'),'end':item.get('end'),'confidence':item.get('score')})
    return {'entities':entities,'model':MODEL}
