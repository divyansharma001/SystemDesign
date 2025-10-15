import express from 'express';

const app = express();
const PORT = 3000;

let isHealthy = true;

app.get('/profile/:id', (req, res)=>{
    if(!isHealthy){
        return res.status(503).send('Service Unavailable');
    }
   res.json({
    id: req.params.id,
    name: 'Divyansh Sharma'
  });
})

app.get('/toggle-health', (req, res)=>{
    isHealthy = !isHealthy;
    res.send(`Health toggled. Current health: ${isHealthy}`);
})

app.listen(PORT, ()=>{
    console.log(`Profile Service running on port ${PORT}`);
});