class Algorithm:
    def __init__(self):
        pass

    def run_algorithm(self, algo_name, params, data):
        if algo_name == "algo1":
            return self.algo1(params, data)
        elif algo_name == "algo2":
            return self.algo2(params, data)
        else:
            return f"Algorithm '{algo_name}' not found"

    def algo1(self, params, data):
        print(params)
        return "successfully ran algo1"

    def algo2(self, params, data):
        print(params)
        return "successfully ran algo2"
