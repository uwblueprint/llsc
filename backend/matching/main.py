import argparse

from algorithms.algorithm import Algorithm

def run_algorithm(algo_name, params):
    # Fetch the data here
    data = ""
    
    try:
        result = Algorithm().run_algorithm(algo_name, params, data)
        print(result)
    except ValueError as e:
        print(e)


def main():
    parser = argparse.ArgumentParser(description="Test algorithms with parameters to optimize on")
    
    parser.add_argument('--algo', required=True, type=str, help="Algo name to run")
    parser.add_argument('--params', nargs='+', help="List of parameters for the algorithm")

    args = parser.parse_args()

    run_algorithm(args.algo, args.params)

if __name__ == "__main__":
    main()