import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.less';
import './App.css';

export default function HomePage() {
    const navigate = useNavigate();

    useEffect(() => {
        navigate('/email');
    }, []);

    return <></>;
}